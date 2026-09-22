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

// Reuse one client per process; in dev, survive hot reloads.
// Keyed by the connection string so editing DATABASE_URL in .env takes effect without a restart.
const globalForPrisma = globalThis as unknown as { prisma?: Client; prismaUrl?: string };

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== url) {
    const previous = globalForPrisma.prisma;
    globalForPrisma.prisma = createClient();
    globalForPrisma.prismaUrl = url;
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
