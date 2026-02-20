import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "./posthogClient.js";
import posthogReporter from "./lib/middleware/posthogMiddleware.js";

import routes from "./routes/index.js";

export const app = express();

setupExpressErrorHandler(posthog, app);
app.set("trust proxy", true);

// CORS rules
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? true // any origin during development (eg. any port on localhost)
        : /^https:\/\/(.*\.)?lovat\.app$/, // only from lovat.app
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

// Logs requests using posthog
app.use(posthogReporter);

// API entry point
app.use("/v1", routes); //theo was here

app.get("/status", (req, res) => {
  res.status(200).send("Server running");
});
