import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { all } from "axios";


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
                        teamNumber: params.data.team
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
                        teamNumber: params.data.team
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
                const allNotes = notesAndMatches.concat(notesAndMatchesAndNames)
                res.status(200).send(allNotes)
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
                const allNotes = notesAndMatches.concat(notesAndMatchesAndNames)
                res.status(200).send(allNotes)
            }

        }
        else {
            const notesOffTeam = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        teamNumber: params.data.team
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
                },
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