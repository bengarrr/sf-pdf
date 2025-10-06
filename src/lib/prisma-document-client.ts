import { PrismaClient } from "../../prisma-document-database/prisma-document-client-types";

const getPrisma = () => new PrismaClient()

const globalForDocumentDBPrismaClient = global as unknown as {
  documentDBPrismaClient: ReturnType<typeof getPrisma>;
};

export const documentDBPrismaClient =
  globalForDocumentDBPrismaClient.documentDBPrismaClient || getPrisma();

if (process.env.NODE_ENV !== "production")
  globalForDocumentDBPrismaClient.documentDBPrismaClient = documentDBPrismaClient;