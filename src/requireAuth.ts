import jwt from 'jsonwebtoken';
import prisma from "./prismaClient";
import axios from "axios";
import { User } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

export interface AuthenticatedRequest extends ExpressRequest {
    user: User;
}

export const requireAuth = async (req, res, next) => {
    try {
        // Validate JWT
        const tokenString = req.headers.authorization?.split(" ")[1]; // It would be in the format "Bearer <token>" so we split on the space and take the second part

        if (tokenString === undefined) {
            res.status(401).send("No authorization token provided");
            return;
        }

        try {
            const token = jwt.verify(
                tokenString,
                process.env.JWT_SIGNING_KEY,
                {
                    algorithms: ["HS256"], audience: "https://api.lovat.app"
                }
            );
        } catch (error) {
            res.status(401).send("Invalid authorization token");
            return;
        }

        // Update database with info from Auth0
        const token = jwt.decode(tokenString);

        const userId = token.sub as string;

        // Get user info from Auth0
        const authResponse = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
            headers: {
                Authorization: `Bearer ${tokenString}`,
            },
        });

        // Get JSON
        const authData = authResponse.data;

        // Update database
        const user = await prisma.user.upsert({
            where: {
                id: userId,
            },
            update: {
                email: authData.email,
            },
            create: {
                id: userId,
                email: authData.email,
                role: "ANALYST",
            },
        });

        // Add user to request
        req.user = user;

        next();
    } catch (error) {
        console.error(error);

        res.status(500).send("Internal server error");
    }
};
