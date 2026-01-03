import { app } from "@/src/app.js";
import scheduleJobs from "@/src/lib/scheduleJobs.js";
import { migrateDataSources } from "@/src/lib/migrateDataSources.js";
import { clearCache } from "@/src/lib/clearCache.js";

const port = process.env.PORT || 3000;

await scheduleJobs();
await migrateDataSources();
await clearCache();

app.listen(port, () => {
  console.log(`Server running on :${port}`);
});
