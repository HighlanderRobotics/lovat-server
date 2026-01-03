import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import "dotenv/config";

import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "./posthogClient.js";
import posthogReporter from "./lib/middleware/posthogMiddleware.js";

import routes from "./routes/index.js";

export const app = express();

setupExpressErrorHandler(posthog, app);
app.set("trust proxy", true);

app.use(bodyParser.json());
app.use(cookieParser());

// Logs requests using posthog
app.use(posthogReporter);

// API entry point
app.use("/v1", routes);
