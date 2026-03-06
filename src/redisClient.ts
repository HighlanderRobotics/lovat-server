import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const set = async (
  key: string,
  data: string,
): ReturnType<Awaited<typeof redis>["set"]> => {
  return await (await redis).set(key, data);
};

const get = async (key: string): ReturnType<Awaited<typeof redis>["get"]> => {
  return await (await redis).get(key);
};

const del = async (
  key: string[] | string,
): ReturnType<Awaited<typeof redis>["del"]> => {
  return await (await redis).del(key);
};

const flush = async (): ReturnType<Awaited<typeof redis>["flushDb"]> => {
  return await (await redis).flushDb();
};

const incr = async (key: string): ReturnType<Awaited<typeof redis>["incr"]> => {
  return await (await redis).incr(key);
};

const exp = async (
  key: string,
): ReturnType<Awaited<typeof redis>["expire"]> => {
  return await (await redis).expire(key, 3);
};

export const kv = {
  set,
  get,
  del,
  flush,
  incr,
  exp,
};
