import prisma from "../prismaClient";

export default async function deleteOldRequests(): Promise<void> {
  await prisma.emailVerificationRequest.deleteMany({
    where: {
        expiresAt: {
            lt: new Date
        }
    }
  })
}
