
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { error } from "console";
import { User } from "@prisma/client";
import { teamLowerBound, tournamentLowerBound } from "../analysisConstants";



/**
 * Averages stage points for a given team
 */
export const bargePicklistTeam = async (user: User, team: number) => {
    try {
        const params = z.object({
            team: z.number()
        }).safeParse({
            team: team
        })
        if (!params.success) {
            throw (error)
        };
        // let stageRows = []
        let bargeRows;
        if (user.tournamentSource.length >= tournamentLowerBound) {
            if (user.teamSource.length >= teamLowerBound) {
                bargeRows = await prismaClient.scoutReport.groupBy({
                    by: ['bargeResult'],
                    _count: {
                        bargeResult: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                        }
                    }
                });

            }
            else {
                bargeRows = await prismaClient.scoutReport.groupBy({
                    by: ['bargeResult'],
                    _count: {
                        bargeResult: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                        },
                        scouter:
                        {
                            sourceTeamNumber: {
                                in: user.teamSource
                            }
                        }
                    }
                });

            }
        }
        else {
            if (user.teamSource.length > teamLowerBound) {
                bargeRows = await prismaClient.scoutReport.groupBy({
                    by: ['bargeResult'],
                    _count: {
                        bargeResult: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                            tournamentKey:
                            {
                                in: user.tournamentSource
                            }
                        },

                    }
                });


            }
            else {
                bargeRows = await prismaClient.scoutReport.groupBy({
                    by: ['bargeResult'],
                    _count: {
                        bargeResult: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                            tournamentKey:
                            {
                                in: user.tournamentSource
                            }
                        },
                        scouter:
                        {
                            sourceTeamNumber:
                            {
                                in: user.teamSource
                            }
                        }

                    }
                });

            }
        }

        const totalAttemptsStage = bargeRows.reduce((total, item) => {
            if (item.stage !== "NOTHING") {
                return total + item._count.stage;
            }
            return total;
        }, 0);
       
        if (totalAttemptsStage === 0) {
            //can be tuned, baseline value
            return 1.5
        }
   
        const bargeMap = bargeRows.reduce((map, item) => {
            map[item.stage] = item._count.stage;
            return map;
        }, {});
        let deep = ((bargeMap["DEEP"] + 1) / (totalAttemptsStage + 3)) * 12
        if (isNaN(deep)) {
            deep = 1
        }
        let shallow = ((bargeMap["SHALLOW"] || 0 + 1) / (totalAttemptsStage + 3)) * 6
        if (isNaN(shallow)) {
            shallow = 1
        }
        let park = ((bargeMap["PARKED"] + 1) / (totalAttemptsStage + 2)) * 2
        if (isNaN(park)) {
            park = 1
        }
        const averageRuleOfSucsession = deep + shallow + park
     
        return averageRuleOfSucsession



    }
    catch (error) {
        console.log(error)
        throw (error)
    }




}






