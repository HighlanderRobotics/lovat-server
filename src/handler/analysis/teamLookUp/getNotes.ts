import { Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { getSourceFilter } from "../coreAnalysis/averageManyFast";
import { allTeamNumbers, allTournaments } from "../analysisConstants";
import { UserRole } from "@prisma/client";


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
        }

        const sourceTnmtFilter = getSourceFilter(req.user.tournamentSource, await allTournaments);
        const sourceTeamFilter = getSourceFilter(req.user.teamSource, await allTeamNumbers);

        const notes = await prismaClient.scoutReport.findMany({
            where: {
                notes: { not: "" },
                teamMatchData: {
                    teamNumber: params.data.team,
                    tournamentKey: sourceTnmtFilter
                },
                scouter: {
                    sourceTeamNumber: sourceTeamFilter
                }
            },
            select: {
                notes: true,
                // Only scouting leads can edit notes
                uuid: (req.user.role === UserRole.SCOUTING_LEAD),
                scouter: {
                    select: {
                        name: true,
                        sourceTeamNumber: true
                    }
                },
                teamMatchKey: true,
                teamMatchData: {
                    select: {
                        tournament: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            // Most recent first
            orderBy: [
                { teamMatchData: { tournament: { date: 'desc' } } },
                { teamMatchData: { matchType: 'desc' } },
                { teamMatchData: { matchNumber: 'desc' } }
            ]
        });

        const notesAndMatches = notes.map(row => ({
            notes: row.notes,
            match: row.teamMatchKey,
            // Typo is intentional to meet frontend
            tounramentName: row.teamMatchData.tournament.name,
            sourceTeam: row.scouter.sourceTeamNumber,
            scouterName: (row.scouter.sourceTeamNumber === req.user.teamNumber) ? row.scouter.name : undefined,
            uuid: row.uuid
        }));

        res.status(200).send(notesAndMatches);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};