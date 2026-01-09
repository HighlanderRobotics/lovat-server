import { app } from "./app.js";
import scheduleJobs from "./lib/scheduleJobs.js";
import { migrateDataSources } from "./lib/migrateDataSources.js";
import { clearCache } from "./lib/clearCache.js";

const port = process.env.PORT || 3000;

await scheduleJobs();
await migrateDataSources();
await clearCache();

app.listen(port, () => {
  console.log(`Server running on :${port}`);
});
