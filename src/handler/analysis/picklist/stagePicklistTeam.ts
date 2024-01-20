
import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import ss from 'simple-statistics';
import prisma from '../../../prismaClient';
import z from 'zod'
import { error } from "console";




export const stagePicklistTeam = async (req: AuthenticatedRequest, team: number) => {
    try {
        const params = z.object({
            team: z.number()
        }).safeParse({
            team: team
        })
        if (!params.success) {
            throw (error)
        };
        const stageRows = await prismaClient.scoutReport.groupBy({
            by: ['stage'],
            _count: {
                stage: true,
            },
            where: {
                teamMatchData: {
                    tournamentKey: {
                        in: req.user.tournamentSource
                    },
                    teamNumber: team,
                },
                scouter: {
                    sourceTeamNumber: {
                        in: req.user.teamSource
                    }
                }
            }
        });
        const totalAttemptsStage = stageRows.reduce((total, item) => {
            if (item.stage !== "NOTHING") {
                return total + item._count.stage;
            }
            return total;
        }, 0);
        const highNoteRows = await prismaClient.scoutReport.groupBy({
            by: ['highNote'],
            _count: {
                highNote: true,
            },
            where: {
                teamMatchData: {
                    tournamentKey: {
                        in: req.user.tournamentSource
                    },
                    teamNumber: team,
                },
                scouter: {
                    sourceTeamNumber: {
                        in: req.user.teamSource
                    }
                }
            }
        });
        
        if(totalAttemptsStage === 0)
        {
            return 0
        }
        const totalAttempsHighNote = highNoteRows.reduce((total, item) => {
            if (item.highNote !== "NOT_ATTEMPTED") {
                return total + item._count.highNote;
            }
            return total;
        }, 0);
        const stageMap = stageRows.reduce((map, item) => {
            map[item.stage] = item._count.stage;
            return map;
        }, {});
        const onstage = ((stageMap["ONSTAGE"] + 1)/(totalAttemptsStage + 3)) * 3
        const onstageHarmony = ((stageMap["ONSTAGE_HARMONY"] + 1)/(totalAttemptsStage + 3)) * 5
        const park = ((stageMap["PARK"] + 1)/(totalAttemptsStage + 2))
        let averageRuleOfSucsession = onstage + onstageHarmony + park

        if(totalAttempsHighNote !== 0)
        {
            const highNoteMap = highNoteRows.reduce((map, item) => {
                map[item.highNote] = item._count.highNote;
                return map;
            }, {});
            const highNote = (highNoteMap["SUCCESSFUL"]+1)/(totalAttempsHighNote+4)
            averageRuleOfSucsession += highNote
        }
        return averageRuleOfSucsession
        


    }
    catch (error) {
        console.log(error)
        throw(error)
    }




}






