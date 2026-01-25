import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { version } from "../../package.json";

// Enable .openapi() on Zod types
extendZodWithOpenApi(z);

// Shared OpenAPI registry for the app. Other modules can import and register.
export const registry = new OpenAPIRegistry();

// Import and register Prisma-derived schemas
import { registerPrismaSchemas } from "./prisma-zod.js";
registerPrismaSchemas(registry);

// Register security schemes
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
registry.registerComponent("securitySchemes", "slackToken", {
  type: "apiKey",
  in: "header",
  name: "x-slack-signature",
  description:
    "Slack signature header (requires accompanying x-slack-request-timestamp)",
});
registry.registerComponent("securitySchemes", "lovatSignature", {
  type: "apiKey",
  in: "header",
  name: "x-signature",
  description: "HMAC signature header (requires accompanying x-timestamp)",
});

// Minimal example: document the /status health check route
registry.registerPath({
  method: "get",
  path: "/status",
  summary: "Health check",
  description: "Returns a simple message indicating the server is running.",
  responses: {
    200: {
      description: "Server is running",
      content: {
        "text/plain": {
          schema: z.string().openapi({ example: "Server running" }),
        },
      },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Lovat API",
      version: version,
      description:
        "API Documentation for Lovat, a scouting system used to scout teams and matches in the First Robotics Competition",
    },
    servers: [
      { url: `${process.env.BASE_URL || "https://api.lovat.app"}/v1/` },
    ],
  });
}
