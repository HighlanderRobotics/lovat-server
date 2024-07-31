import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { all } from "axios";
import { userInfo } from "os";


export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: Number(req.params.team),
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if (req.user.teamNumber !== null) {
            const notesOnTeam = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        teamNumber: params.data.team,
                        tournamentKey:
                        {
                            in: req.user.tournamentSource
                        }
                    },
                    scouter:
                    {
                        sourceTeamNumber: req.user.teamNumber
                    },
                    notes:
                    {
                        not: ""
                    }
                },
                orderBy: [
                    {
                        teamMatchData:
                        {
                            tournament:
                            {
                                date: "desc"
                            },
                        }
                    },
                    {
                        teamMatchData:
                        {
                           
                            matchType: "asc"
                        }

                    },
                    {
                        teamMatchData:
                        {
                            matchNumber: "asc"
                        }
                    }


                ],
                include:
                {
                    scouter: true,
                    teamMatchData: {
                        include:
                        {
                            tournament: true
                        }
                    }
                }
            })
            const notesOffTeam = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        teamNumber: params.data.team,
                        tournamentKey: {
                            in: req.user.tournamentSource
                        }
                    },
                    scouter:
                    {
                        sourceTeamNumber:
                        {
                            in: req.user.teamSource,
                            not: req.user.teamNumber
                        }

                    },

                    notes:
                    {
                        not: ""
                    }

                },
                orderBy: 
                [
                    {
                        teamMatchData:
                        {
                            tournament:
                            {
                                date: "desc"
                            },
                        }
                    },
                    {
                        teamMatchData:
                        {
                           
                            matchType: "asc"
                        }

                    },
                    {
                        teamMatchData:
                        {
                            matchNumber: "asc"
                        }
                    }


                ],
                include:
                {
                    teamMatchData: {
                        include:
                        {
                            tournament: true
                        }
                    }
                },

            })
            if (req.user.role === "SCOUTING_LEAD") {


                const notesAndMatches = notesOffTeam.map(item => ({
                    notes: item.notes,
                    match: item.teamMatchKey,
                    matchNumber: item.teamMatchData.matchNumber,
                    matchType: item.teamMatchData.matchType,
                    tournamentKey: item.teamMatchData.tournamentKey,
                    matchKey: item.teamMatchKey,
                    tounramentName: item.teamMatchData.tournament.name,
                }));
                const notesAndMatchesAndNames = notesOnTeam.map(item => ({
                    notes: item.notes,
                    match: item.teamMatchKey,
                    scouterName: item.scouter.name,
                    matchNumber: item.teamMatchData.matchNumber,
                    matchType: item.teamMatchData.matchType,
                    tournamentKey: item.teamMatchData.tournamentKey,
                    matchKey: item.teamMatchKey,
                    tounramentName: item.teamMatchData.tournament.name,
                    uuid: item.uuid


                }));
                const combinedNotes = notesAndMatches.concat(notesAndMatchesAndNames)
                combinedNotes.sort((a, b) => {
                    if (a.tournamentKey < b.tournamentKey) return -1;
                    if (a.tournamentKey > b.tournamentKey) return 1;
                    
                    if (a.matchType < b.matchType) return -1;
                    if (a.matchType > b.matchType) return 1;
                    
                    return a.matchNumber - b.matchNumber;
                });
                res.status(200).send(combinedNotes)
            }
            else {

                const notesAndMatches = notesOffTeam.map(item => ({
                    notes: item.notes,
                    match: item.teamMatchKey,
                    matchNumber: item.teamMatchData.matchNumber,
                    matchType: item.teamMatchData.matchType,
                    tournamentKey: item.teamMatchData.tournamentKey,
                    matchKey: item.teamMatchKey,
                    tounramentName: item.teamMatchData.tournament.name,
                }));
                const notesAndMatchesAndNames = notesOnTeam.map(item => ({
                    notes: item.notes,
                    match: item.teamMatchKey,
                    scouterName: item.scouter.name,
                    matchNumber: item.teamMatchData.matchNumber,
                    matchType: item.teamMatchData.matchType,
                    tournamentKey: item.teamMatchData.tournamentKey,
                    matchKey: item.teamMatchKey,
                    tounramentName: item.teamMatchData.tournament.name,


                }));
                const combinedNotes = notesAndMatches.concat(notesAndMatchesAndNames)
                combinedNotes.sort((a, b) => {
                    if (a.tournamentKey < b.tournamentKey) return -1;
                    if (a.tournamentKey > b.tournamentKey) return 1;
                    
                    if (a.matchType < b.matchType) return -1;
                    if (a.matchType > b.matchType) return 1;
                    
                    return a.matchNumber - b.matchNumber;
                });                
                res.status(200).send(combinedNotes)
            }

        }
        else {
            const notesOffTeam = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        teamNumber: params.data.team,
                        tournamentKey: {
                            in: req.user.tournamentSource
                        }
                    },
                    scouter:
                    {
                        sourceTeamNumber:
                        {
                            in: req.user.teamSource,
                        }

                    },
                    notes:
                    {
                        not: ""
                    }
                }
                ,
                orderBy:
                    [
                        {
                            teamMatchData:
                            {
                                tournament:
                                {
                                    date: "desc"
                                },
                            }
                        },
                        {
                            teamMatchData:
                            {
                               
                                matchType: "asc"
                            }

                        },
                        {
                            teamMatchData:
                            {
                                matchNumber: "asc"
                            }
                        }


                    ],
                include:
                {
                    scouter: true,
                    teamMatchData: {
                        include:
                        {
                            tournament: true
                        }
                    }
                }

            })
            const notesAndMatches = notesOffTeam.map(item => ({
                notes: item.notes,
                uuid: item.uuid,
                matchNumber: item.teamMatchData.matchNumber,
                matchType: item.teamMatchData.matchType,
                tournamentKey: item.teamMatchData.tournamentKey,
                tournamentName: item.teamMatchData.tournament.name,
                matchKey: item.teamMatchKey
            }));
            res.status(200).send(notesAndMatches)
            return

        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};