import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  // Without this check the pg driver silently falls back to localhost:5432.
  if (!connectionString?.trim()) {
    throw new Error("DATABASE_URL is not set, so the database can’t be reached.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

type Client = ReturnType<typeof createClient>;

// Reuse one client per process; in dev, survive hot reloads. Recreated when DATABASE_URL changes
// or when `prisma generate` produces a new client, so neither needs a dev server restart.
const globalForPrisma = globalThis as unknown as { prisma?: Client; prismaUrl?: string; prismaClass?: unknown };

function getClient() {
  const url = process.env.DATABASE_URL;
  const stale = globalForPrisma.prismaUrl !== url || globalForPrisma.prismaClass !== PrismaClient;
  if (!globalForPrisma.prisma || stale) {
    const previous = globalForPrisma.prisma;
    globalForPrisma.prisma = createClient();
    globalForPrisma.prismaUrl = url;
    globalForPrisma.prismaClass = PrismaClient;
    void previous?.$disconnect().catch(() => {});
  }
  return globalForPrisma.prisma;
}

/** Created on first use, so a missing DATABASE_URL fails the query that needs it, not every import. */
export const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
