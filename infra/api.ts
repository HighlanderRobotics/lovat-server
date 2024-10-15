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
