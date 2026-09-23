import type { ChatSeverity } from "@/generated/prisma/enums";

/**
 * Phrases that suggest a possible emergency. Checked before the assistant runs (and when it isn't
 * configured), so these never depend on the model noticing them. Deliberately broad: a false alarm
 * only means a pharmacist reads the chat sooner.
 */
const EMERGENCY_PATTERNS = [
  /chest (pain|tightness)/,
  /(can'?t|cannot|can not|difficulty|trouble|struggling to) breath/,
  /short(ness)? of breath|not breathing|stopped breathing/,
  /unconscious|unresponsive|passed out|collapsed|fainted/,
  /seizure|convuls|fitting/,
  /overdose|took too many|swallowed (too many|poison|bleach|kerosene)|poison/,
  /suicid|kill (myself|himself|herself)|end my life|self[- ]?harm|hurt myself/,
  /stroke|face (is )?droop|slurred speech/,
  /(heavy|severe|won'?t stop|uncontrolled) bleeding|bleeding (heavily|a lot)|(vomit|cough)(ing|ed)? (up )?blood/,
  /anaphyla|(throat|tongue|lips?) (is |are )?swell|swollen (throat|tongue|lips?)/,
];

export function looksLikeEmergency(text: string) {
  const normalized = text.toLowerCase().replace(/[’`]/g, "'");
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(normalized));
}

export type Handover = {
  /** Null when the customer asked for a pharmacist, or the assistant couldn't help. */
  severity: ChatSeverity | null;
  reason: string;
  note?: string;
};

/** What the customer is told when a chat is handed over. Fixed text, never model-written. */
export function handoverNotice(severity: ChatSeverity | null) {
  if (severity === "EMERGENCY") {
    return "This could be a medical emergency. Please call 112 or go to the nearest hospital emergency department now; don’t wait for a reply here. We’ve also alerted a pharmacist.";
  }
  if (severity === "SEVERE") {
    return "This needs to be looked at properly, so I’ve passed it to one of our pharmacists. They’ll reply here as soon as possible. If it gets worse, see a doctor or go to a hospital without waiting.";
  }
  return "I’ve passed this to one of our pharmacists. They’ll reply here as soon as possible; you can close this window and come back to it.";
}

export const CHAT_NOTICES = {
  pharmacistJoined: (name: string) => `${name} (pharmacist) has joined the chat.`,
  closed: "This chat has been closed. Send a message any time to start a new one.",
};
