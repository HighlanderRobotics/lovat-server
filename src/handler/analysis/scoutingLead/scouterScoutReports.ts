import { Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";


export const scouterScoutReports = async (req : AuthenticatedRequest, res : Response): Promise<void> => {
    try {
        const params = z.object({
            tournamentKey : z.string().nullable(),
            scouterUuid : z.string()
        }).safeParse({
            tournamentKey : req.query.tournamentKey || null,
            scouterUuid : req.query.scouterUuid
        })
        if (!params.success) {
            res.status(400).send(params)
            return
        };
        const scouter = await prismaClient.scouter.findUnique({
            where :
            {
                uuid : params.data.scouterUuid
            }
        })
        if(!scouter)
        {
            res.status(500).send("Scouter doesn't exist")
            return
        }
        if(req.user.role !== "SCOUTING_LEAD" || req.user.teamNumber === null || req.user.teamNumber !== scouter.sourceTeamNumber)
        {
            res.status(403).send("Not authorized for this endpoint")
            return
        }
        if(!params.data.tournamentKey)
        {
            const allScoutReports = await prismaClient.scoutReport.findMany({
                where :
                {
                    scouterUuid : params.data.scouterUuid
                },
                select :
                {
                    scouter : {
                        select :
                        {
                            name : true
                        }
                    },
                    teamMatchData :
                    {
                        select :
                        {
                            teamNumber : true,
                            key : true,
                            matchNumber : true,
                            matchType : true,
                            tournament :
                            {
                                select :
                                {
                                    key : true,
                                    name : true
                                }
                            }
                        }
                    
                    },
                    uuid : true
                },
                // Most recent first
                orderBy: [
                    { teamMatchData: { tournament: { date: 'desc' } } },
                    { teamMatchData: { matchType: 'desc' } },
                    { teamMatchData: { matchNumber: 'desc' } }
                ]
            })
            res.status(200).send(allScoutReports)
        }
        else
        {
            const tournamentScoutReports = await prismaClient.scoutReport.findMany({
                where :
                {
                    scouterUuid : params.data.scouterUuid,
                    teamMatchData :
                    {
                        tournamentKey : params.data.tournamentKey
                    }
                },
                select :
                {
                    scouter : {
                        select :
                        {
                            name : true
                        }
                    },
                    teamMatchData :
                    {
                        select :
                        {
                            teamNumber : true,
                            key : true,
                            matchNumber : true,
                            matchType : true,
                            tournament :
                            {
                                select :
                                {
                                    key : true,
                                    name : true
                                }
                            }
                        }
                    
                    },
                    uuid : true
                },
                // Most recent first
                orderBy: [
                    { teamMatchData: { tournament: { date: 'desc' } } },
                    { teamMatchData: { matchType: 'desc' } },
                    { teamMatchData: { matchNumber: 'desc' } }
                ]
            })
            res.status(200).send(tournamentScoutReports)
        }

    }
    catch (error) {
        console.log(error)
       res.status(500).send(error)
    }

};