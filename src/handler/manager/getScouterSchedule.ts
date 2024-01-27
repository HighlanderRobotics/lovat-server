import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { SHA256 } from "crypto-js";


export const getScouterSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
            tournament : z.string()
        }).safeParse({
            tournament : req.params.tournament
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(req.user.teamNumber === null)
        {
            res.status(400).send("User is not affilated with a team")
            return
        }
        const rows = await prismaClient.scouterScheduleShift.findMany({
            where:
            {
                sourceTeamNumber : req.user.teamNumber,
                tournamentKey : params.data.tournament,
            },
            include :
            {
                team1 : {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                },
                team2 : {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                },
                team3 : {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                },
                team4 :  {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                },
                team5 :  {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                },
                team6 :  {
                    select :
                    {
                        name : true,
                        uuid : true,
                    }
                }
            }

        })


        res.status(200).send({hash : hashJsonObject(rows), data : rows});
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};
function hashJsonObject(json: object): string {
    const jsonString = JSON.stringify(json);

    const hash = SHA256(jsonString);

    return hash.toString();
}