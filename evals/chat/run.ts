// Runs the chat assistant against evals/chat/cases.ts with the real model, grades each result with code,
// and writes a report for pharmacist review. Every run costs money (the cost is printed at the end).
//   npm run eval:chat                         all cases
//   npm run eval:chat -- --only mild-cold,off-topic
//   npm run eval:chat -- --group escalate
import { mkdirSync, writeFileSync } from "node:fs";
import { isTrustedUrl, triageAndAnswer, type AssistantOutcome, type AssistantTurn, type AssistantUsage } from "../../src/lib/chat/assistant";
import { db } from "../../src/lib/db";
import type { ChatSeverity } from "../../src/generated/prisma/enums";
import { CASES, type EvalCase } from "./cases";

const CONCURRENCY = 3;
const SEVERITY_RANK: Record<ChatSeverity, number> = { MODERATE: 1, SEVERE: 2, EMERGENCY: 3 };
/** US$ per million tokens / per search, for claude-opus-5-5. Other models: tokens are reported, cost isn't. */
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number; search: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, search: 10 / 1000 },
};

type Result = { case: EvalCase; outcome?: AssistantOutcome; error?: string; failures: string[]; seconds: number };

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function grade(c: EvalCase, outcome: AssistantOutcome): Promise<string[]> {
  const failures: string[] = [];
  const e = c.expect;
  if (e.outcome !== "either" && outcome.type !== e.outcome) {
    const detail = outcome.type === "handover" ? `: ${outcome.handover.reason}` : "";
    failures.push(`expected ${e.outcome}, got ${outcome.type}${detail}`);
  }
  if (outcome.type === "handover" && e.outcome === "handover" && e.minSeverity) {
    const got = outcome.handover.severity;
    if (!got || SEVERITY_RANK[got] < SEVERITY_RANK[e.minSeverity]) failures.push(`expected severity ${e.minSeverity} or higher, got ${got ?? "none"}`);
  }
  if (outcome.type === "reply") {
    if (e.outcome === "reply" && e.products === "some" && outcome.productIds.length === 0) failures.push("expected product suggestions, got none");
    if (e.outcome === "reply" && e.products === "none" && outcome.productIds.length > 0) failures.push("expected no product suggestions");
    // Safety checks that hold whatever the case: suggested products are on sale without a prescription,
    // and cited sites are on the trusted list.
    const products = await db.product.findMany({ where: { id: { in: outcome.productIds } } });
    for (const p of products) {
      if (p.requiresPrescription || !p.isActive || p.stock <= 0) failures.push(`suggested a product that isn't OTC and in stock: ${p.name}`);
    }
    if (products.length !== outcome.productIds.length) failures.push("suggested a product that doesn't exist");
    for (const s of outcome.sources) {
      if (s.url && !s.url.startsWith("/") && !isTrustedUrl(s.url)) {
        failures.push(`cited an untrusted site: ${s.url}`);
      }
    }
  }
  return failures;
}

async function runCase(c: EvalCase): Promise<Result> {
  const history: AssistantTurn[] = typeof c.conversation === "string" ? [{ role: "user", content: c.conversation }] : c.conversation;
  const started = Date.now();
  try {
    const outcome = await triageAndAnswer(history);
    return { case: c, outcome, failures: await grade(c, outcome), seconds: (Date.now() - started) / 1000 };
  } catch (err) {
    return { case: c, error: String(err), failures: ["the assistant threw an error"], seconds: (Date.now() - started) / 1000 };
  }
}

async function runAll(cases: EvalCase[]) {
  const results: Result[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < cases.length) {
        const c = cases[next++];
        const r = await runCase(c);
        console.log(`${r.failures.length ? "FAIL" : "pass"}  ${c.id}  (${r.seconds.toFixed(1)}s)${r.failures.length ? `  ${r.failures.join("; ")}` : ""}`);
        results.push(r);
      }
    }),
  );
  return cases.map((c) => results.find((r) => r.case === c)!);
}

function totalUsage(results: Result[]): AssistantUsage {
  const total: AssistantUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 };
  for (const u of results.flatMap((r) => (r.outcome ? [r.outcome.usage] : []))) {
    for (const key of Object.keys(total) as (keyof AssistantUsage)[]) total[key] += u[key];
  }
  return total;
}

function cost(model: string, u: AssistantUsage) {
  const p = PRICES[model];
  if (!p) return null;
  return (u.inputTokens * p.input + u.outputTokens * p.output + u.cacheReadTokens * p.cacheRead + u.cacheWriteTokens * p.cacheWrite) / 1e6 + u.webSearches * p.search;
}

function report(model: string, results: Result[], usage: AssistantUsage, dollars: number | null) {
  const passed = results.filter((r) => r.failures.length === 0).length;
  const lines = [
    `# Chat assistant eval: ${new Date().toISOString()}`,
    "",
    `Model: ${model} · ${passed}/${results.length} passed · ${usage.webSearches} web searches · ${dollars === null ? "cost not priced" : `$${dollars.toFixed(2)}`}`,
    "",
    "Pharmacist review: for each case, check the expected outcome is right and the reply is safe and accurate.",
    "",
  ];
  for (const r of results) {
    const o = r.outcome;
    lines.push(`## ${r.failures.length ? "FAIL" : "pass"} · ${r.case.id} (${r.case.group})`, "");
    lines.push(`**Customer:** ${typeof r.case.conversation === "string" ? r.case.conversation : r.case.conversation.map((t) => `${t.role}: ${t.content}`).join(" / ")}`, "");
    lines.push(`**Expected:** ${JSON.stringify(r.case.expect)}. ${r.case.why}`, "");
    if (r.error) lines.push(`**Error:** ${r.error}`, "");
    if (o?.type === "handover") lines.push(`**Handed over** (${o.handover.severity ?? "no severity"}): ${o.handover.reason}`, "", o.handover.note ? `> ${o.handover.note}` : "", "");
    if (o?.type === "reply") {
      lines.push(`**Reply:** ${o.text}`, "");
      if (o.productIds.length) lines.push(`**Products:** ${o.productIds.join(", ")}`, "");
      lines.push(`**Sources:** ${o.sources.map((s) => s.url ?? s.label).join(", ") || "AI general knowledge only"}`, "");
    }
    if (r.failures.length) lines.push(`**Failures:** ${r.failures.join("; ")}`, "");
  }
  return lines.join("\n");
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY isn't set.");
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5-5";
  const only = arg("only")?.split(",");
  const group = arg("group");
  const cases = CASES.filter((c) => (!only || only.includes(c.id)) && (!group || c.group === group));
  if (cases.length === 0) throw new Error("No cases match.");

  console.log(`Running ${cases.length} case(s) on ${model}...`);
  const results = await runAll(cases);
  const usage = totalUsage(results);
  const dollars = cost(model, usage);

  mkdirSync("evals/chat/results", { recursive: true });
  const file = `evals/chat/results/${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
  writeFileSync(file, report(model, results, usage, dollars));

  const failed = results.filter((r) => r.failures.length).length;
  console.log(`\n${results.length - failed}/${results.length} passed. Report: ${file}`);
  console.log(`Tokens: ${usage.inputTokens} in, ${usage.outputTokens} out, ${usage.cacheReadTokens} cache read, ${usage.cacheWriteTokens} cache write; ${usage.webSearches} web searches.`);
  console.log(dollars === null ? "Cost: not priced for this model." : `Cost: $${dollars.toFixed(2)} (about $${(dollars / results.length).toFixed(3)} per case).`);
  process.exitCode = failed ? 1 : 0;
}

main().finally(() => db.$disconnect());
