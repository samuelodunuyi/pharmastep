import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes and try again.";

type Limit = { limit: number; windowSeconds: number };

/**
 * The caller's IP address. On Vercel the platform sets x-forwarded-for, so its first entry is the
 * real client. Null when there's no such header (local development).
 */
export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/** A one-way hash of a value, for keys that shouldn't store raw IPs or emails. */
export function hashed(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Counts one request for `action` by `who` (an IP address, an email...) and says whether it's allowed:
 * false once `limit` requests were made in the last `windowSeconds`. Kept in the database, so it holds
 * across serverless instances.
 */
export async function rateLimit(action: string, who: string, { limit, windowSeconds }: Limit) {
  const key = hashed(`${action}:${who.toLowerCase()}`);
  const recent = await db.rateLimitHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowSeconds * 1000) } } });
  if (recent >= limit) return false;
  await db.rateLimitHit.create({ data: { key } });
  // Now and then, clear out rows older than any window, instead of running a scheduled job.
  if (Math.random() < 0.01) {
    await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } } });
  }
  return true;
}

/** rateLimit by the caller's IP address. Without one (local development), nothing is limited. */
export async function rateLimitByIp(action: string, limit: Limit) {
  const ip = await clientIp();
  return ip ? rateLimit(action, ip, limit) : true;
}

/**
 * Password sign-in attempts, limited per IP address and per account, so neither guessing one account's
 * password nor trying one password across many accounts gets far. Staff accounts get fewer tries.
 */
export async function allowSignInAttempt(scope: "customer" | "staff", email: string) {
  const window = 15 * 60;
  const perAccount = scope === "staff" ? 5 : 10;
  return (
    (await rateLimitByIp(`${scope}-sign-in`, { limit: 30, windowSeconds: window })) &&
    (await rateLimit(`${scope}-sign-in-account`, email, { limit: perAccount, windowSeconds: window }))
  );
}
