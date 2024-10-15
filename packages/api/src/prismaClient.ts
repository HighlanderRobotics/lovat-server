import { PrismaClient } from "@prisma/client";
import { Resource } from "sst";

const globalForPrisma = global as unknown as { prismaClient: PrismaClient };

const prismaClient =
  globalForPrisma.prismaClient ||
  new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${Resource.LovatDB.username}:${Resource.LovatDB.password}@${Resource.LovatDB.host}:${Resource.LovatDB.port}/${Resource.LovatDB.database}?connection_limit=1`,
      },
    },
  });

export default prismaClient;

// Create single client in `sst dev`
if (process.env.NODE_ENV !== "production")
  globalForPrisma.prismaClient = prismaClient;
