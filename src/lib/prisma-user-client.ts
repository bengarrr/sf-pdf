import { PrismaClient } from "../../prisma-user-database/prisma-user-client-types";
import { withAccelerate } from "@prisma/extension-accelerate"

const getPrisma = () => new PrismaClient().$extends(withAccelerate());

const globalForUserDBPrismaClient = global as unknown as {
  userDBPrismaClient: ReturnType<typeof getPrisma>;
};

export const userDBPrismaClient =
  globalForUserDBPrismaClient.userDBPrismaClient || getPrisma();

if (process.env.NODE_ENV !== "production")
  globalForUserDBPrismaClient.userDBPrismaClient = userDBPrismaClient;