import "dotenv/config";
import app from "./app";
import scheduleJobs from "./lib/scheduleJobs";
import { migrateDataSources } from "./lib/migrateDataSources";
import { clearCache } from "./lib/clearCache";

const port = process.env.PORT || 3000;

await scheduleJobs();
await migrateDataSources();
await clearCache();

app.listen(port);
