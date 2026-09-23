import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { isAssistantConfigured } from "@/lib/env";
import { formatNaira } from "@/lib/format";
import { quotedLabels, reviewReply } from "@/lib/chat/guard";
import { looksLikeEmergency, type Handover } from "@/lib/chat/triage";
import { CATALOGUE_SOURCE, type ChatSource } from "@/lib/chat/types";

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5-5";
/** Model round trips per customer message (searching, then answering, usually takes 2–3). */
const MAX_STEPS = 5;
const MAX_RECOMMENDATIONS = 3;
const MAX_WEB_SEARCHES = 3;

/**
 * The only websites the assistant may search and cite (approved list; change it with the pharmacists).
 * A domain also covers its subdomains, so NHS is limited to www.nhs.uk: other *.nhs.uk sites are local
 * GP practices and trusts. The others' subdomains all belong to the same organisation.
 */
export const TRUSTED_SITES = ["www.nhs.uk", "medlineplus.gov", "medicines.org.uk", "nafdac.gov.ng", "who.int"];

const SYSTEM_PROMPT = `You are the assistant in PharmaStep's "Ask a pharmacist" chat. PharmaStep is a licensed online pharmacy in Lagos, Nigeria. Licensed pharmacists take over chats that need them.

Your job is to help with mild, self-limiting complaints that a pharmacist would normally handle over the counter, and to hand everything else to a pharmacist.

Mild cases you may help with, in an otherwise healthy adult: a common cold, a mild sore throat, an occasional headache, mild heartburn or indigestion, mild hay fever, minor skin irritation, minor aches, and general questions about products we sell.

Call escalate_to_pharmacist, instead of answering, when any of these apply:
- symptoms that are severe, getting worse, keep coming back, or have lasted more than a few days (for example a fever for more than 3 days)
- the person is pregnant or breastfeeding, a child under 12, or a frail older adult
- a long-term condition (for example diabetes, high blood pressure, kidney or liver disease, asthma, sickle cell) or regular medicines that could interact
- prescription-only medicines, antibiotics, changing a prescribed dose, or a suspected side effect
- mental health concerns
- they ask for a pharmacist, or you are unsure
Severity: "moderate" needs a pharmacist's judgement but isn't urgent; "severe" means they should see a doctor soon; "emergency" means a possible danger to life. When you escalate, don't write a reply: the app tells the customer what happens next.

For a mild case:
- Before suggesting a medicine, make sure you know who it is for, their age group, how long it has been going on, and whether they take other medicines or have allergies. Ask for what's missing in one short message.
- Base health information (what helps, self-care, warning signs) on the trusted health websites: check them with web_search before advising, and don't state medical facts you couldn't find there.
- Only suggest products that search_products returned in this turn, and attach them with recommend_products. Never invent products, prices or stock.
- Never state a dose, how often to take something, or a maximum amount in your own words. If a product in the search results has label_directions (checked by our pharmacists), you may quote the relevant sentences exactly as written, in quotation marks, and say they're from the pack label. Quote each sentence whole, from its first word, including who it applies to (e.g. "Adults and children aged 12 years and over: ..."); a shortened quote is not allowed and won't be sent; otherwise tell them to follow the directions on the pack. Don't name prescription-only medicines.
- Add brief self-care advice and say when they should see a pharmacist or doctor instead.
- You don't diagnose. If asked, say you're PharmaStep's automated assistant and a pharmacist can take over at any time.

Style: warm, plain English, short. Two to five sentences, no headings, lists or markdown. Don't restate prices; product cards show them. Only discuss health and PharmaStep's products and orders.

Latency-sensitive; begin your visible answer immediately.`;

const TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  // The basic search version: the newer one filters pages through code first and then returns no citations,
  // and citations are what the source pills are built from.
  { type: "web_search_20250305", name: "web_search", allowed_domains: TRUSTED_SITES, max_uses: MAX_WEB_SEARCHES },
  {
    name: "search_products",
    description:
      "Search PharmaStep's in-stock, over-the-counter products by ingredient, product name or complaint, e.g. 'paracetamol', 'cough', 'antacid'. Returns up to 8 matches with their IDs.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "A few search words." } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "recommend_products",
    description: `Show up to ${MAX_RECOMMENDATIONS} products as cards (with price and an add-to-cart button) under your reply. Only IDs returned by search_products in this turn are accepted.`,
    strict: true,
    input_schema: {
      type: "object",
      properties: { product_ids: { type: "array", items: { type: "string" } } },
      required: ["product_ids"],
      additionalProperties: false,
    },
  },
  {
    name: "escalate_to_pharmacist",
    description: "Hand the chat to a human pharmacist. Use for anything beyond a mild case (see your instructions).",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: ["moderate", "severe", "emergency"] },
        reason: { type: "string", description: "One line for the pharmacist: why this needs them." },
        summary: {
          type: "string",
          description: "What the customer has said so far: who it's for, age, symptoms, how long, medicines, allergies.",
        },
      },
      required: ["severity", "reason", "summary"],
      additionalProperties: false,
    },
  },
];

const SEVERITY = { moderate: "MODERATE", severe: "SEVERE", emergency: "EMERGENCY" } as const;

export type AssistantTurn = { role: "user" | "assistant"; content: string };
/** Tokens and searches used for one customer message, for cost tracking (see evals/chat). */
export type AssistantUsage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; webSearches: number };
export type AssistantOutcome =
  | { type: "reply"; text: string; productIds: string[]; sources: ChatSource[]; usage: AssistantUsage }
  | { type: "handover"; handover: Handover; usage: AssistantUsage };

const noUsage = (): AssistantUsage => ({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 });

function addUsage(total: AssistantUsage, usage: Anthropic.Beta.BetaUsage) {
  total.inputTokens += usage.input_tokens;
  total.outputTokens += usage.output_tokens;
  total.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
  total.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
  total.webSearches += usage.server_tool_use?.web_search_requests ?? 0;
}

/** Same rule as the search's allowed_domains: the site itself or one of its subdomains. */
export function isTrustedUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return TRUSTED_SITES.some((site) => host === site || host.endsWith(`.${site}`));
  } catch {
    return false;
  }
}

/** The pages the final reply cites, one pill each. Only trusted sites count, whatever the API returned. */
function webSources(blocks: Anthropic.Beta.BetaTextBlock[]): ChatSource[] {
  const pages = new Map<string, ChatSource>();
  for (const citation of blocks.flatMap((b) => b.citations ?? [])) {
    if (citation.type !== "web_search_result_location" || !isTrustedUrl(citation.url) || pages.has(citation.url)) continue;
    const label = new URL(citation.url).hostname.replace(/^www\./, "");
    pages.set(citation.url, { label, url: citation.url, title: citation.title ?? undefined });
  }
  return [...pages.values()];
}

let client: Anthropic | undefined;
function anthropic() {
  // Reads ANTHROPIC_API_KEY. Two retries on rate limits, overloads and network errors.
  client ??= new Anthropic({ maxRetries: 2, timeout: 45_000 });
  return client;
}

async function searchProducts(query: string) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3).slice(0, 6);
  if (words.length === 0) return [];
  const matches = words.flatMap((w) => [
    { name: { contains: w, mode: "insensitive" as const } },
    { activeIngredient: { contains: w, mode: "insensitive" as const } },
    { description: { contains: w, mode: "insensitive" as const } },
    { category: { name: { contains: w, mode: "insensitive" as const } } },
  ]);
  const products = await db.product.findMany({
    where: { isActive: true, requiresPrescription: false, stock: { gt: 0 }, OR: [...matches, { tags: { hasSome: words } }] },
    select: {
      id: true,
      slug: true,
      name: true,
      activeIngredient: true,
      strength: true,
      dosageForm: true,
      packSize: true,
      priceKobo: true,
      description: true,
      tags: true,
      label: { select: { status: true, directions: true, warnings: true, reviewedAt: true } },
    },
    orderBy: { name: "asc" },
    take: 40,
  });
  // Most relevant first: a word in the name or ingredient counts more than one in the tags or description.
  const score = (p: (typeof products)[number]) =>
    words.reduce((sum, w) => {
      const strong = `${p.name} ${p.activeIngredient ?? ""}`.toLowerCase().includes(w);
      const weak = `${p.tags.join(" ")} ${p.description ?? ""}`.toLowerCase().includes(w);
      return sum + (strong ? 2 : weak ? 1 : 0);
    }, 0);
  return products.sort((a, b) => score(b) - score(a)).slice(0, 8);
}

/**
 * Answers the customer's latest message, or decides the chat needs a pharmacist.
 * `history` is the text of the conversation so far, oldest first, ending with the customer.
 */
export async function runAssistant(history: AssistantTurn[]): Promise<AssistantOutcome> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const usage = noUsage();
  const handover = (reason: string, extra: Partial<Handover> = {}): AssistantOutcome => ({
    type: "handover",
    handover: { severity: null, reason, ...extra },
    usage,
  });
  const found = new Set<string>();
  let recommended: string[] = [];
  let searchedCatalogue = false;
  // Pharmacist-approved pack labels of the products found this turn: the only doses a reply may state.
  const labels = new Map<string, { name: string; slug: string; directions: string; checked: boolean }>();

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await anthropic().beta.messages.create({
      model: MODEL,
      // Thinking counts toward this too; running out hands the chat to a pharmacist.
      max_tokens: 16_000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });
    addUsage(usage, response.usage);

    if (response.stop_reason === "refusal") return handover("The assistant couldn’t answer this message.");
    if (response.stop_reason === "max_tokens") return handover("The assistant’s reply was cut off.");
    // A long web search can pause the turn; sending it back unchanged lets it continue.
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    const escalation = toolUses.find((t) => t.name === "escalate_to_pharmacist");
    if (escalation) {
      const input = escalation.input as { severity: keyof typeof SEVERITY; reason: string; summary: string };
      return handover(input.reason, { severity: SEVERITY[input.severity] ?? "MODERATE", note: input.summary });
    }

    if (response.stop_reason !== "tool_use") {
      // All text in the final response is the reply (working notes come back as thinking, not text),
      // even when a search sits between parts of it. Cited text arrives split into several blocks,
      // so they're joined without separators.
      const replyBlocks = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text");
      const text = replyBlocks.map((b) => b.text).join("").trim();
      if (!text) return handover("The assistant gave no answer.");

      const approved = [...labels.values()];
      const heldBack = await reviewReply(text, approved.map((l) => l.directions));
      if (heldBack) return handover(heldBack, { note: `Held-back reply: ${text}` });

      const labelSources = quotedLabels(text, approved).map((l) => ({
        label: `Pack label: ${l.name}`,
        url: `/products/${l.slug}`,
        title: l.checked ? "Directions from the pack, checked by a PharmaStep pharmacist" : "Directions from the official product leaflet",
      }));
      const sources = [...(searchedCatalogue ? [CATALOGUE_SOURCE] : []), ...labelSources, ...webSources(replyBlocks)];
      return { type: "reply", text, productIds: recommended, sources, usage };
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const tool of toolUses) {
      if (tool.name === "search_products") {
        const products = await searchProducts((tool.input as { query: string }).query);
        searchedCatalogue = true;
        for (const p of products) {
          found.add(p.id);
          if (p.label?.status === "APPROVED") {
            labels.set(p.id, { name: p.name, slug: p.slug, directions: p.label.directions, checked: !!p.label.reviewedAt });
          }
        }
        const listing = products.map((p) => ({
          id: p.id,
          name: p.name,
          active_ingredient: p.activeIngredient,
          strength: p.strength,
          form: p.dosageForm,
          pack: p.packSize,
          price: formatNaira(p.priceKobo),
          description: p.description?.slice(0, 300),
          ...(p.label?.status === "APPROVED" && { label_directions: p.label.directions, label_warnings: p.label.warnings }),
        }));
        results.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: listing.length ? JSON.stringify(listing) : "No in-stock, over-the-counter products matched.",
        });
      } else if (tool.name === "recommend_products") {
        const ids = (tool.input as { product_ids: string[] }).product_ids;
        const accepted = ids.filter((id) => found.has(id)).slice(0, MAX_RECOMMENDATIONS);
        recommended = accepted;
        const rejected = ids.length - accepted.length;
        results.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: `${accepted.length} product(s) will be shown under your reply.${rejected ? ` ${rejected} ID(s) were ignored: only use IDs from this turn's search results, at most ${MAX_RECOMMENDATIONS}.` : ""} Now write your reply.`,
        });
      } else {
        results.push({ type: "tool_result", tool_use_id: tool.id, content: `Unknown tool ${tool.name}.`, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return handover("The assistant couldn’t finish its answer.");
}

/**
 * The full decision for a customer message, in order: possible-emergency wording goes straight to a
 * pharmacist without asking the model; so does everything when the assistant is off or the chat has
 * reached its reply limit; the rest goes to the assistant. Used by the chat and by evals/chat.
 */
export async function triageAndAnswer(history: AssistantTurn[], { replyLimitReached = false } = {}): Promise<AssistantOutcome> {
  const latest = history.at(-1)?.content ?? "";
  const skip = (handover: Handover): AssistantOutcome => ({ type: "handover", handover, usage: noUsage() });
  if (looksLikeEmergency(latest)) {
    return skip({ severity: "EMERGENCY", reason: "Message mentions possible emergency symptoms.", note: latest });
  }
  if (!isAssistantConfigured()) return skip({ severity: null, reason: "The assistant isn’t switched on." });
  if (replyLimitReached) return skip({ severity: null, reason: "Long conversation with the assistant." });
  return runAssistant(history);
}
