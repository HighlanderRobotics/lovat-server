import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({accelerateUrl: process.env.DATABASE_URL}).$extends(withAccelerate());

export default prisma;
