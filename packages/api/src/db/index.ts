import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resource } from "sst";
import * as schema from "./schema";

const pool = new Pool({
  host: Resource.LovatDB.host,
  port: Resource.LovatDB.port,
  user: Resource.LovatDB.username,
  password: Resource.LovatDB.password,
  database: Resource.LovatDB.database,
});

export const db = drizzle(pool, { schema });
