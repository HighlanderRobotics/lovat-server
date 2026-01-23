import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Enable .openapi() on Zod types
extendZodWithOpenApi(z);

// Shared OpenAPI registry for the app. Other modules can import and register.
export const registry = new OpenAPIRegistry();

// Import and register Prisma-derived schemas
import { registerPrismaSchemas } from "./prisma-zod.js";
registerPrismaSchemas(registry);

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
      version: "1.0.0",
      description:
        "Bare-bones OpenAPI spec generated from Zod schemas using zod-to-openapi.",
    },
    servers: [{ url: "/" }],
  });
}
