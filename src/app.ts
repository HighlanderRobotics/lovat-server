import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import "dotenv/config";

import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "@/src/posthogClient.js";
import posthogReporter from "@/src/lib/middleware/posthogMiddleware.js";

import routes from "@/src/routes/index.js";

export const app = express();

setupExpressErrorHandler(posthog, app);
app.set("trust proxy", true);

app.use(bodyParser.json());
app.use(cookieParser());

// Logs requests using posthog
app.use(posthogReporter);

// API entry point
app.use("/v1", routes);
