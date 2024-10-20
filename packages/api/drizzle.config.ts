import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  dialect: "postgresql",
  // Pick up all our schema files
  schema: ["./src/db/schema.ts"],
  out: "./migrations",
  dbCredentials: {
    host: Resource.LovatDB.host,
    port: Resource.LovatDB.port,
    user: Resource.LovatDB.username,
    password: Resource.LovatDB.password,
    database: Resource.LovatDB.database,
  },
});
