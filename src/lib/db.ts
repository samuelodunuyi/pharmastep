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

// One client per copy of the PrismaClient class, kept on globalThis so dev hot reloads reuse it.
// Server bundles can each carry their own copy of the class, so a client is never shared across
// copies or closed by another one. `prisma generate` produces a new class, which gets a fresh client
// without a dev server restart; a changed DATABASE_URL replaces that class's client.
const globalForPrisma = globalThis as unknown as { prismaClients?: Map<unknown, { url?: string; client: Client }> };
const clients = (globalForPrisma.prismaClients ??= new Map());

function getClient() {
  const url = process.env.DATABASE_URL;
  const entry = clients.get(PrismaClient);
  if (entry?.url === url) return entry.client;
  const client = createClient();
  clients.set(PrismaClient, { url, client });
  void entry?.client.$disconnect().catch(() => {});
  return client;
}

/** Created on first use, so a missing DATABASE_URL fails the query that needs it, not every import. */
export const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
