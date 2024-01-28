import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { SHA256 } from "crypto-js";
import { addTournamentMatches } from "./addTournamentMatches";


export const getScouters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       
        if(req.user.teamNumber === null)
        {
            res.status(400).send("User is not affilated with a team")
            return
        }
        const rows = await prismaClient.scouter.findMany({
            where:
            {
                sourceTeamNumber : req.user.teamNumber,
            },
            select : 
            {
                uuid : true,
                name : true
            }
        })


        res.status(200).send(rows);
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