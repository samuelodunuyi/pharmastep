import "server-only";
import { db } from "@/lib/db";

/**
 * Dosing instructions. A reply may only state one by quoting a pharmacist-approved pack label word
 * for word; any other dose, frequency or maximum is held back (see reviewReply).
 */
const DOSING_PATTERNS = [
  /\b(take|give|use|have)\s+(\d+|one|two|three|four|half)\b/i,
  /\bevery\s+\d+(\s*(-|to)\s*\d+)?\s*hours?\b/i,
  /\b(once|twice|three times|four times|\d+\s*times)\s+(a|per|each)\s+day\b/i,
  /\b\d+(\.\d+)?\s?(mg|mcg|g|ml)\b[^.]{0,40}\b(every|daily|a day|per day|times|hourly)\b/i,
  /(?<!pack of\s)\b\d+\s*(tablets?|caplets?|capsules?|teaspoons?|spoonfuls?|sachets?|drops|puffs)\b/i,
  /\bmax(imum)?\b[^.]{0,20}\d+/i,
];

const normalize = (s: string) => s.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

/** A label's sentences, normalized for matching; fragments too short to be meaningful are skipped. */
function labelSentences(directions: string) {
  return directions
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalize(s).replace(/[.!?]$/, ""))
    .filter((s) => s.length >= 15);
}

/** The labels a reply quotes word for word (at least one whole sentence). */
export function quotedLabels<T extends { directions: string }>(text: string, labels: T[]): T[] {
  const reply = normalize(text);
  return labels.filter((l) => labelSentences(l.directions).some((s) => reply.includes(s)));
}

function containsWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/** Brand and ingredient names of the catalogue's prescription-only products, e.g. "Augmentin", "Amoxicillin". */
async function prescriptionOnlyNames() {
  const products = await db.product.findMany({
    where: { requiresPrescription: true },
    select: { name: true, activeIngredient: true },
  });
  const names = products.flatMap((p) => [p.name.split(/\s+/)[0], ...(p.activeIngredient?.split(/[/,+]/) ?? [])]);
  // Short or generic words ("Vitamin", "Acid") would match ordinary advice, so only distinctive names count.
  return [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 6 && !/^(vitamin|acid|sodium)$/i.test(n)))];
}

/**
 * Checks an assistant reply before the customer sees it. Returns why it must go to a pharmacist
 * instead, or null if it can be sent. A dose is allowed only as an exact quote of a sentence from
 * `approvedDirections` (pharmacist-approved pack labels); anything else about dosing is held back.
 */
export async function reviewReply(text: string, approvedDirections: string[] = []): Promise<string | null> {
  let unquoted = normalize(text);
  for (const sentence of approvedDirections.flatMap(labelSentences)) unquoted = unquoted.split(sentence).join(" ");
  if (DOSING_PATTERNS.some((pattern) => pattern.test(unquoted))) {
    return "The assistant’s reply gave dosing instructions, so it was held back.";
  }
  const rxName = (await prescriptionOnlyNames()).find((name) => containsWord(text, name));
  if (rxName) return `The assistant’s reply mentioned a prescription-only medicine (${rxName}), so it was held back.`;
  return null;
}
