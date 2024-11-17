import { Request, Response } from "express";
import z from "zod"
import axios from "axios";

// Returns rank, RP, and matches played for given team at given tournament
export const teamTournamentRank = async (req: Request, res: Response) => {
    try {
        const params = z.object({
            eventKey: z.string(),
            teamKey: z.string()
        }).safeParse({
            eventKey: req.params.event,
            teamKey: "frc" + req.query.team
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

        // Search for and return data
        for (const currRanking of response.data.rankings){
            if (currRanking.team_key === params.data.teamKey) {
                res.status(200).send({
                    rank: currRanking.rank,
                    rp: currRanking.extra_stats[0],
                    qm: currRanking.matches_played
                })
                break;
            }
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};