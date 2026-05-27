// Singleton PrismaClient — CarCrew Commerce
// Prisma 7 + @prisma/adapter-pg (PostgreSQL via Vercel Postgres/Neon)

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.POSTGRES_PRISMA_URL;

  if (!url) {
    // Fallback para dev/build — retorna um proxy que quebra só na query
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        return () => {
          throw new Error(
            "POSTGRES_PRISMA_URL não configurada. " +
              "Deploy no Vercel com Postgres para ativar."
          );
        };
      },
    });
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
