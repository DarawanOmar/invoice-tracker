import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

// Reuse one client across hot reloads in development. It may be an instance
// of an older generated client, so it is typed loosely here.
const globalForPrisma = globalThis as unknown as {
  prisma?: { $disconnect: () => Promise<void> };
};

function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  // After `prisma generate` the client class is new; a cached instance of the
  // old class would not know about new models, so replace it.
  if (cached instanceof PrismaClient) return cached;
  if (cached) void cached.$disconnect();
  return createClient();
}

export const prisma = getClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
