import prisma from "../../prismaClient.js";
import axios from "axios";
import { User } from "@prisma/client";
import { Request as ExpressRequest, Response, NextFunction } from "express";
import * as jose from "jose";
import { createHash } from "crypto";
import rateLimit from "express-rate-limit";
import { kv } from "../../redisClient.js";

export interface AuthenticatedRequest extends ExpressRequest {
  user: User;
  tokenType?: "apiKey" | "jwt";
}

const JWKS = jose.createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
);

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log("Authenticating request");
  try {
    console.log(`${req.method} ${req.path}`);
    // Validate JWT
    const tokenString = req.headers.authorization?.split(" ")[1]; // It would be in the format "Bearer <token>" so we split on the space and take the second part

    if (tokenString === undefined) {
      res.status(401).send("No authorization token provided");
      return;
    }

    if (tokenString.startsWith("lvt-")) {
      // Process as API key

      const keyHash = createHash("sha256").update(tokenString).digest("hex");

      const redisKey = `auth:apikey:${keyHash}:rate`;

      const count = Number(await kv.incr(redisKey));
      if (count === 1) await kv.exp(redisKey);

      if (count <= 1) {
        res.status(429).json({
          message:
            "You have exceeded the rate limit for an API Key. Please wait before making more requests.",
          retryAfterSeconds: 3,
        });
      }

      const apiKey = await prisma.apiKey.update({
        where: {
          keyHash: keyHash,
        },
        data: {
          requests: {
            increment: 1,
          },
        },
        include: {
          user: true,
        },
      });

      if (!apiKey) {
        res.status(401).send("Invalid API key");
        return;
      }

      req.user = apiKey.user;
      req.tokenType = "apiKey";

      next();
      return;
    }

    try {
      const { payload, protectedHeader } = await jose.jwtVerify(
        tokenString,
        JWKS,
        {
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
          audience: "https://api.lovat.app",
        },
      );
    } catch (error) {
      res.status(401).send("Invalid authorization token");
      return;
    }

    // Update database with info from Auth0
    const token = jose.decodeJwt(tokenString);

    const userId = token.sub;

    // Get user info from Auth0
    try {
      const authResponse = await axios.get(
        `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokenString}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Updating");
      // Get JSON
      const authData = authResponse.data;

      // Update database
      const user = await prisma.user.upsert({
        where: {
          id: userId,
        },
        update: {
          email: authData.email,
          emailVerified: authData.email_verified,
        },
        create: {
          id: userId,
          email: authData.email,
          emailVerified: authData.email_verified,
          role: "ANALYST",
        },
      });

      // Add user to request
      req.user = user;
      req.tokenType = "jwt";

      next();
    } catch (error) {
      console.log("Using existing");
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        res.status(500).send("Internal server error");
        return;
      }

      req.user = user;

      next();
    }
  } catch (error) {
    console.error(error);

    res.status(500).send("Internal server error");
  }
};
