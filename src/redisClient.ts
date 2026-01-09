import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const set: Awaited<typeof redis>["set"] = async (...args) => {
  return await (await redis).set(...args) ;
};

const get: Awaited<typeof redis>["get"] = async (...args) => {
  return await (await redis).get(...args) ;
};

const del: Awaited<typeof redis>["del"] = async (...args) => {
  return await (await redis).del(...args) ;
};

const flush: Awaited<typeof redis>["flushDb"] = async (...args) => {
  return await (await redis).flushDb(...args) ;
};

export const kv = {
  set,
  get,
  del,
  flush,
};
