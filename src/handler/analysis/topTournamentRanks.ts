import { Request, Response } from "express";
import z from "zod"
import axios from "axios";

// Returns top four teams from given tournament with rank, RP, and qual matches played
export const topTournamentRanks = async (req: Request, res: Response) => {
    try {
        const params = z.object({
            eventKey: z.string(),
        }).safeParse({
            eventKey: req.params.event
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        // Make TBA request
        const url = "https://www.thebluealliance.com/api/v3";
        const response = await axios.get(`${url}/event/${params.data.eventKey}/rankings`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        });

        // Get top four teams, ordered by rank ascending
        const winners: {
            teamNumber: number
            rp: number
            qm: number
        }[] = [];
        for (const currRanking of response.data.rankings){
            if (currRanking.rank <= 4) {
                winners[currRanking.rank - 1] = {
                    teamNumber: Number(currRanking.team_key.substring(3)),
                    rp: currRanking.extra_stats[0],
                    qm: currRanking.matches_played
                };
            }
        }

        res.status(200).send(winners)
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};