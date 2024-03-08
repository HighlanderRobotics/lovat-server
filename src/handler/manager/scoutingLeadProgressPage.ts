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
       
        if (params.data.tournamentKey) {
            const matchesAtTournamentRows = await prismaClient.teamMatchData.groupBy({
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
            const totalTournamentMatches = matchesAtTournamentRows.length
            const scouters = await prismaClient.scouter.findMany({
                where:
                {
                    sourceTeamNumber: req.user.teamNumber
                },
                include:
                {
                    scoutReports: true,
                    Team1Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    },
                    Team2Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    },
                    Team3Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    },
                    Team4Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    },
                    Team5Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    },
                    Team6Shifts : {
                        where :
                        {
                            tournamentKey : params.data.tournamentKey,
                            startMatchOrdinalNumber :
                            {
                                lte : totalTournamentMatches
                            }
                        }
                    }
                },
                orderBy : {
                    name : "asc"
                }
            })
           
            let result = []
            for(const scouter of scouters)
            {
                const allShifts = [
                    ...scouter.Team1Shifts,
                    ...scouter.Team2Shifts,
                    ...scouter.Team3Shifts,
                    ...scouter.Team4Shifts,
                    ...scouter.Team5Shifts,
                    ...scouter.Team6Shifts
                ];
            
                // iterate over all shifts and sum total assigned matches
                let totalAssignedScouterMatches = 0
                allShifts.forEach(shift => {
                    const matchesForShift = (shift.endMatchOrdinalNumber - shift.startMatchOrdinalNumber);
                    if(shift.endMatchOrdinalNumber > totalTournamentMatches)
                    {
                        totalAssignedScouterMatches += totalTournamentMatches - shift.startMatchOrdinalNumber
                    }
                    else
                    {
                        totalAssignedScouterMatches += matchesForShift;
                    }
                });
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
                const currData = {scouterUuid : scouter.uuid, scouterName : scouter.name, matchesScouted : matchesScoutedAtTournament.length, missedMatches : Math.max(0, totalAssignedScouterMatches-matchesScoutedAtTournament.length)}
                result.push(currData)
            }
            
            res.status(200).send(result)

        }
        else {
            const scouters = await prismaClient.scouter.findMany({
                where :
                {
                    sourceTeamNumber : req.user.teamNumber
                },
                include :
                {
                    scoutReports : true
                },
                orderBy : {
                    name : "asc"
                }
            })
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
