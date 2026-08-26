import prisma from "../../prismaClient";

const getReports = async () => {
  console.log(
    (
      await prisma.scoutReport.findMany({
        where: {
          teamMatchData: {
            tournamentKey: "2026casnf",
          },
        },
        include: {
          events: true,
        },
      })
    ).slice(0, 1),
  );
};

getReports();
