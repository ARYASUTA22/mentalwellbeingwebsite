import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Races a Prisma query against a fast timeout (default 2200ms) so an unreachable
 * or paused remote database never blocks server rendering on startup.
 */
export async function withDbTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs = 2200
): Promise<T> {
  return await Promise.race([
    queryPromise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database query timed out"));
      }, timeoutMs);
    }),
  ]);
}
