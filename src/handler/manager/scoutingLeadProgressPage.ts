import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const scoutingLeadProgressPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const params = z.object({
            tournamentKey: z.string().nullable()
        }).safeParse({
            tournamentKey: req.query.tournamentKey || null
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if (req.user.teamNumber === null) {
            res.status(400).send("Not affilated with a team")
            return
        }
        if (req.user.role !== "SCOUTING_LEAD") {
            res.status(400).send("Not a scouting lead")
            return
        }
        const scouters = await prismaClient.scouter.findMany({
            where:
            {
                sourceTeamNumber: req.user.teamNumber
            },
            include:
            {
                scoutReports: true
            }
        })
        if (params.data.tournamentKey) {
            const totalMatchesAtTournaent = await prismaClient.teamMatchData.groupBy({
                by: ["matchType", "matchNumber"],
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    scoutReports:
                    {
                        some:
                            {}
                    }
                }
            })
            console.log(totalMatchesAtTournaent)
            const totalMatchesScoutedAtTournament = totalMatchesAtTournaent.length
            let result = []
            for(const scouter of scouters)
            {
                const matchesScoutedAtTournament = await prismaClient.scoutReport.groupBy({
                    by : ["teamMatchKey"],
                    where :
                    {
                        scouterUuid : scouter.uuid,
                        teamMatchData :
                        {
                            tournamentKey : params.data.tournamentKey
                        }
                    }
                })
                const currData = {scouterUuid : scouter.uuid, scouterName : scouter.name, matchesScouted : matchesScoutedAtTournament.length, missedMatches : totalMatchesScoutedAtTournament-matchesScoutedAtTournament.length}
                result.push(currData)
            }
            
            res.status(200).send(result)

        }
        else {
            const formattedScouters = scouters.map(scouter => ({
                scouterUuid: scouter.uuid,
                scouterName: scouter.name,
                matchesScouted: scouter.scoutReports.length,
                missedMatches : 0
            }));
            res.status(200).send(formattedScouters)
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error)
    }

};