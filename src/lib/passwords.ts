import { randomInt } from "node:crypto";

// No look-alike characters (0/O, 1/l/I), so the password is easy to read out or type from a message.
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const ALL = LOWER + UPPER + DIGITS;

/** Temporary staff password: 14 characters, always mixing lower, upper and digits. */
export function generateTempPassword(length = 14) {
  const chars = [LOWER, UPPER, DIGITS].map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(ALL[randomInt(ALL.length)]);
  // Shuffle so the guaranteed characters aren't always at the start.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export const MIN_PASSWORD_LENGTH = 8;
