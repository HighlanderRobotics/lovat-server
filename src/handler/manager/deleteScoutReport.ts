import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { kv } from "../../redisClient";

export const deleteScoutReport = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const scouter = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: params.data.uuid,
      },
      include: {
        scouter: true,
      },
    });
    if (scouter === null) {
      res.status(404).send("Scouter or scout report not found");
      return;
    }

    if (
      scouter.scouter.sourceTeamNumber === user.teamNumber &&
      user.role === "SCOUTING_LEAD"
    ) {
      await prismaClient.event.deleteMany({
        where: {
          scoutReportUuid: params.data.uuid,
        },
      });
      const reportRow = await prismaClient.scoutReport.delete({
        where: {
          uuid: params.data.uuid,
        },
        include: {
          teamMatchData: true,
        },
      });

      res.status(200).send("Data deleted successfully");

      // Collect all affected cached analyses
      const analysisRows = await prismaClient.cachedAnalysis.findMany({
        where: {
          teamDependencies: {
            has: reportRow.teamMatchData.teamNumber,
          },
          tournamentDependencies: {
            has: reportRow.teamMatchData.tournamentKey,
          },
        },
        select: { key: true },
      });

      if (analysisRows.length > 0) {
        const keysToDelete = analysisRows.map((row) => row.key);

        await Promise.allSettled(keysToDelete.map((key) => kv.del(key)));

        await prismaClient.cachedAnalysis.deleteMany({
          where: { key: { in: keysToDelete } },
        });
      }
    } else {
      res.status(403).send("Unauthorized to delete this picklist");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
