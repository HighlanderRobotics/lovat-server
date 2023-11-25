import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";


export const deleteScoutReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const uuid = req.params.uuid;
        const user = req.user

        const DeleteScoutReportSchema = z.object({
            uuid: z.string()
        })
        const deleteScoutReport = {
            uuid: uuid
        }
        const possibleTypeErrorScoutReport = DeleteScoutReportSchema.safeParse(deleteScoutReport)
        if (!possibleTypeErrorScoutReport.success) {
            res.status(400).send(possibleTypeErrorScoutReport)
            return
        }

        const scouter = await prismaClient.scoutReport.findUnique({
            where:
            {
                uuid: uuid
            },
            include: {
                scouter: true
            }

        });
        if (scouter === null) {
            res.status(400).send("Scouter or scout report not found")
            return
        }

        if (scouter.scouter.sourceTeamNumber === user.teamNumber && user.role === "SCOUTING_LEAD") {

            await prismaClient.event.deleteMany
                ({
                    where: {
                        scoutReportUuid: uuid
                    }
                });
            await prismaClient.scoutReport.delete({
                where:
                {
                    uuid: uuid
                }
            })
            res.status(200).send("Data deleted successfully");
        } else {
            res.status(403).send("Unauthorized to delete this picklist");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
