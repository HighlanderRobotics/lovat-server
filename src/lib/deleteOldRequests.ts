import prisma from "../prismaClient.js";

export default async function deleteOldRequests(): Promise<void> {
  await prisma.emailVerificationRequest.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  await prisma.registeredTeam.deleteMany({
    where: {
      timeCreated: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Delete teams created more than a day ago that haven't verified their email
      },
      emailVerified: false,
    },
  });
}
