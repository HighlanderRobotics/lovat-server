import prisma from "../prismaClient.js";

export default async function deleteOldRequests(): Promise<void> {
  await prisma.emailVerificationRequest.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  await prisma.scoutReport.deleteMany();
  await prisma.slackNotificationThread.deleteMany();
}
