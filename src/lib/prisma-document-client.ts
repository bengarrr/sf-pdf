import { PrismaClient } from "../../prisma-document-database/prisma-document-client-types";
import { withAccelerate } from "@prisma/extension-accelerate"

const getPrisma = () => new PrismaClient().$extends(withAccelerate());

const globalForDocumentDBPrismaClient = global as unknown as {
  documentDBPrismaClient: ReturnType<typeof getPrisma>;
};

export const documentDBPrismaClient =
  globalForDocumentDBPrismaClient.documentDBPrismaClient || getPrisma();

if (process.env.NODE_ENV !== "production")
  globalForDocumentDBPrismaClient.documentDBPrismaClient = documentDBPrismaClient;