import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import "dotenv/config";

import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "./posthogClient.js";
import posthogReporter from "./lib/middleware/posthogMiddleware.js";

import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./lib/openapi.js";
import path from "path";

export const app = express();

setupExpressErrorHandler(posthog, app);
app.set("trust proxy", true);

app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static(path.resolve("public")));

// Logs requests using posthog
app.use(posthogReporter);

// API entry point
app.use("/v1", routes); //theo was here

app.get("/status", (req, res) => {
  res.status(200).send("Server running");
});

// OpenAPI docs
const openApiDocument = generateOpenApiDocument();
app.get("/doc.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use(
  "/doc",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customCssUrl: "/swaggerTheme.css",
  }),
);
