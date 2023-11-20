import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { type } from "os";


export const addScouterShift = async (req: Request, res: Response): Promise<void> => {
    try {
        let userID = "change later"
        let tournamentKey = req.body.tournamentKey
        let startMatchOrdinalNumber = req.body.startMatchOrdinalNumber
        let endMatchOrdinalNumber = req.body.endMatchOrdinalNumber
        let team1 = req.body.team1
        let team2 = req.body.team2
        let team3 = req.body.team3
        let team4 = req.body.team4
        let team5 = req.body.team5
        let team6 = req.body.team6

        let userId = "change later"

        //switch from email
        const user = await prismaClient.users.findUnique({
            where: { email: userID }, 
        });

        if (!user || user.teamNumber === undefined) {
            res.status(404).send("User or user's team not found");
            return;
        }
        if (typeof tournamentKey === "string" && typeof startMatchOrdinalNumber === 'number' && typeof endMatchOrdinalNumber === 'number' && Array.isArray(team1) && Array.isArray(team2) && Array.isArray(team3) && Array.isArray(team4) && Array.isArray(team5) && Array.isArray(team6)) {
            const rows = await prismaClient.scouterScheduleShift.create({
                data: {
                    sourceTeamNumber: user.teamNumber,
                    tournamentKey: tournamentKey,
                    startMatchOrdinalNumber: startMatchOrdinalNumber,
                    endMatchOrdinalNumber: endMatchOrdinalNumber,
                    team1: team1,
                    team2: team2,
                    team3: team3,
                    team4: team4,
                    team5: team5,
                    team6: team6,

                }
            })

            res.status(200).send(rows);
        }
        else {
            res.status(400).send("incorrect types")
        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};