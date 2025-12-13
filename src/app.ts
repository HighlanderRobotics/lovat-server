import express from "express";
import routes from "./routes";
import cookieParser from "cookie-parser";
import posthogReporter from "./lib/middleware/posthogMiddleware";
import bodyParser from "body-parser";
import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "./posthogClient";

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(posthogReporter);

setupExpressErrorHandler(posthog, app);

// everything under /v1
app.use("/v1", routes);

export default app;
