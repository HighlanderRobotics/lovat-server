import { PostHog } from "posthog-node";
import { ENVIRONMENT } from "@/src/lib/environment.js";

export const posthog = new PostHog(process.env.POSTHOG_PROJECT_API_KEY, {
  disableGeoip: true,
  before_send: (event) => {
    event.properties["environment"] = ENVIRONMENT;
    event.properties["eventSource"] = "server";
    return event;
  },
});
