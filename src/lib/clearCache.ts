import prismaClient from "../prismaClient";
import { kv } from "../redisClient";

const clearCache = async () => {
  await prismaClient.cachedAnalysis.deleteMany();

  kv.flush();

  console.log("Cache cleared");
};
