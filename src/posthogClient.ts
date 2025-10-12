import { PostHog } from "posthog-node";

export const posthog = new PostHog(process.env.POSTHOG_PROJECT_API_KEY, {
  disableGeoip: true,
});
