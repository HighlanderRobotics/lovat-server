import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { type } from "os";
import z from 'zod'
 import { AuthenticatedRequest } from "../../requireAuth";


export const addScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

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
            tournamentKey: req.params.tournament,
            startMatchOrdinalNumber: req.body.startMatchOrdinalNumber,
            endMatchOrdinalNumber: req.body.endMatchOrdinalNumber,
            team1: req.body.team1,
            team2: req.body.team2,
            team3: req.body.team3,
            team4: req.body.team4,
            team5: req.body.team5,
            team6: req.body.team6,
        }
        const possibleTypeErrorShift = ScouterScheduleShiftSchema.safeParse(currScouterScheduleShift)
        if (!possibleTypeErrorShift.success) {
            res.status(400).send(possibleTypeErrorShift)
            return
        }

        if (user.role === "SCOUTING_LEAD") {
            const rows = await prismaClient.scouterScheduleShift.create({
                data: currScouterScheduleShift
            })
            res.status(200).send("done adding scouter shift");
            
        }
        else
        {
            res.status(401).send("Not authorized to add scouter shift")
        }


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};