import prisma from "../../prismaClient";
import axios from "axios";
import { User } from "@prisma/client";
import { Request as ExpressRequest } from "express";
import * as jose from "jose";
import { Resource } from "sst";

export interface AuthenticatedRequest extends ExpressRequest {
  user: User;
}

export const requireAuth = async (req: AuthenticatedRequest, res, next) => {
  try {
    console.log(`${req.method} ${req.path}`);
    // Validate JWT
    const tokenString = req.headers.authorization?.split(" ")[1]; // It would be in the format "Bearer <token>" so we split on the space and take the second part

    if (tokenString === undefined) {
      res.status(401).send("No authorization token provided");
      return;
    }

    try {
      const JWKS = jose.createRemoteJWKSet(
        new URL(`https://${Resource.Auth0Domain.value}/.well-known/jwks.json`)
      );

      const { payload, protectedHeader } = await jose.jwtVerify(
        tokenString,
        JWKS,
        {
          issuer: `https://${Resource.Auth0Domain.value}/`,
          audience: "https://api.lovat.app",
        }
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
        `https://${Resource.Auth0Domain.value}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokenString}`,
            "Content-Type": "application/json",
          },
        }
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
