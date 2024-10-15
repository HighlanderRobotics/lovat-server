/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "lovat",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const api = await import("./infra/api");
    await import("./infra/rds");
    await import("./infra/vpc");

    return {
      api: api.lovatAPI.url,
    };
  },
});
