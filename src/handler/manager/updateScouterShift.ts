import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updateScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const uuid = req.params.uuid

        const ScouterScheduleShiftSchema = z.object({
            sourceTeamNumber: z.number(),
            tournamentKey: z.string(),
            startMatchOrdinalNumber: z.number(),
            endMatchOrdinalNumber: z.number(),
            team1: z.array(z.string()),
            team2: z.array(z.string()),
            team3: z.array(z.string()),
            team4: z.array(z.string()),
            team5: z.array(z.string()),
            team6: z.array(z.string())
        })

        const user = req.user
         
        const currScouterScheduleShift = {
            sourceTeamNumber: user.teamNumber,
            tournamentKey: req.body.tournamentKey,
            startMatchOrdinalNumber: req.body.startMatchOrdinalNumber,
            endMatchOrdinalNumber: req.body.endMatchOrdinalNumber,
            team1: req.body.team1,
            team2: req.body.team2,
            team3: req.body.team3,
            team4: req.body.team4,
            team5: req.body.team5,
            team6: req.body.team6,
        }
        const possibleTypeError = ScouterScheduleShiftSchema.safeParse(currScouterScheduleShift)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }


        if (user.role === "SCOUTING_LEAD") {
                const rows = await prismaClient.scouterScheduleShift.updateMany({
                    where:
                    {
                         uuid: uuid as string ,
                         sourceTeamNumber : user.teamNumber
                       
                    },
                    data : currScouterScheduleShift
                })
            if(!rows)
            {
                res.status(400).send("cannot find scouter shift")
                return
            }
            res.status(200).send("scouter shift updated successfully");
        } else {
            res.status(403).send("Unauthorized to delete this picklist");
        }



    } catch (error) {
        console.error(error);
        res.status(400).send("Error in deleting data");
    }
};
