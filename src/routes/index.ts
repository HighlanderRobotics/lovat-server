import { Router } from "express";

import slackRouter from "./slack/slack.routes.js";
import managerRouter from "./manager/manager.routes.js";
import analysisRouter from "./analysis/analysis.routes.js";
import { onboardingRedirect } from "../handler/slack/onboardingRedirect.js";
import { generateOpenApiDocument } from "../lib/openapi.js";
import swaggerUi from "swagger-ui-express";

const router = Router();

router.use("/slack", slackRouter);
router.use("/manager", managerRouter);
router.use("/analysis", analysisRouter);

router.get("/slack-invite", onboardingRedirect);

// OpenAPI docs
const isDevelopment = process.env.NODE_ENV === "development";
const openApiDocument = !isDevelopment ? generateOpenApiDocument() : undefined;

router.get("/doc.json", (_req, res) => {
  const doc = isDevelopment ? generateOpenApiDocument() : openApiDocument;
  res.json(doc);
});

router.use(
  "/doc",
  swaggerUi.serve,
  swaggerUi.setup(isDevelopment ? undefined : openApiDocument, {
    // In development, Swagger UI will fetch the spec from /doc.json on each request.
    swaggerOptions: isDevelopment ? { url: "/v1/doc.json" } : undefined,
    customCssUrl: "/swaggerTheme.css",
  }),
);
export default router;
