import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updateScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const user = req.user
        const params = z.object({
            sourceTeamNumber: z.number(),
            tournamentKey: z.string(),
            startMatchOrdinalNumber: z.number(),
            endMatchOrdinalNumber: z.number(),
            team1: z.array(z.string()),
            team2: z.array(z.string()),
            team3: z.array(z.string()),
            team4: z.array(z.string()),
            team5: z.array(z.string()),
            team6: z.array(z.string()),
            uuid : z.string()
        }).safeParse({
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
            uuid : req.params.uuid

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };


        if (user.role === "SCOUTING_LEAD") {
                const rows = await prismaClient.scouterScheduleShift.updateMany({
                    where:
                    {
                         uuid: params.data.uuid ,
                         sourceTeamNumber : user.teamNumber
                       
                    },
                    data : {
                        sourceTeamNumber : params.data.sourceTeamNumber,
                        tournamentKey : params.data.tournamentKey,
                        startMatchOrdinalNumber : params.data.startMatchOrdinalNumber,
                        endMatchOrdinalNumber : params.data.endMatchOrdinalNumber,
                        team1 : params.data.team1,
                        team2 : params.data.team2,
                        team3 : params.data.team3,
                        team4 : params.data.team4,
                        team5 : params.data.team5,
                        team6 : params.data.team6,


                    }
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
