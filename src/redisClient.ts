import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export default redis;
