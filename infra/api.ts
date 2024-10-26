import { rds } from "./rds";
import {
  tbaKey,
  resendKey,
  slackWebhook,
  lovatSigningKey,
  auth0Domain,
} from "./secrets";
import { vpc } from "./vpc";

export const lovatAPI = new sst.aws.Function("LovatAPI", {
  vpc,
  url: true,
  handler: "packages/api/src/index.handler",
  link: [rds, tbaKey, resendKey, slackWebhook, lovatSigningKey, auth0Domain],
  copyFiles: [
    {
      from: "node_modules/.prisma/client",
      to: ".prisma/client",
    },
  ],
});

new sst.x.DevCommand("QRCodes", {
  dev: {
    title: "QR Codes",
    command: "npx ts-node src/apiQRCodes.ts",
    directory: "packages/scripts",
    autostart: true,
  },
  environment: {
    API_URL: lovatAPI.url,
    STAGE: $app.stage,
  },
  link: [lovatAPI],
});
