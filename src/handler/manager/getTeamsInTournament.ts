import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const getTeamsInTournament = async (req: Request, res: Response): Promise<void> => {
    try {
        let tournamentKey = req.query.key;
        if (typeof tournamentKey !== 'string') {
            res.status(400).send("Invalid tournament key");
            return;
        }

        const rows = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey: tournamentKey
            },
            select: {
                teamNumber: true
            }
        });

        const uniqueTeamNumbers = Array.from(new Set(rows.map(row => row.teamNumber)));

        res.status(200).json(uniqueTeamNumbers);
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
    
