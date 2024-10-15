
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { error } from "console";
import { User } from "@prisma/client";
import { teamLowerBound, tournamentLowerBound } from "../analysisConstants";




export const stagePicklistTeam = async (user: User, team: number) => {
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
        let stageRows;
        let highNoteRows;
        if (user.tournamentSource.length >= tournamentLowerBound) {
            if (user.teamSource.length >= teamLowerBound) {
                stageRows = await prismaClient.scoutReport.groupBy({
                    by: ['stage'],
                    _count: {
                        stage: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                        }
                    }
                });
                highNoteRows = await prismaClient.scoutReport.groupBy({
                    by: ['highNote'],
                    _count: {
                        highNote: true,
                    },
                    where: {
                        teamMatchData: {
                           
                            teamNumber: team,
                        }
                    }
                });
            }
            else
            {
                stageRows = await prismaClient.scoutReport.groupBy({
                    by: ['stage'],
                    _count: {
                        stage: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                        },
                        scouter :
                        {
                            sourceTeamNumber : {
                                in : user.teamSource
                               }
                        }
                    }
                });
                highNoteRows = await prismaClient.scoutReport.groupBy({
                    by: ['highNote'],
                    _count: {
                        highNote: true,
                    },
                    where: {
                        teamMatchData: {
                           
                            teamNumber: team,
                        },
                        scouter: {
                           sourceTeamNumber : {
                            in : user.teamSource
                           }
                        }
                    }
                });
            }
        }
        else
        {
            if(user.teamSource.length > teamLowerBound)
            {
                stageRows = await prismaClient.scoutReport.groupBy({
                    by: ['stage'],
                    _count: {
                        stage: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                            tournamentKey :
                            {
                                in : user.tournamentSource
                            }
                        },
                        
                    }
                });
                highNoteRows = await prismaClient.scoutReport.groupBy({
                    by: ['highNote'],
                    _count: {
                        highNote: true,
                    },
                    where: {
                        teamMatchData: {
                           
                            teamNumber: team,
                            tournamentKey :
                            {
                                in : user.tournamentSource
                            }
                        },
                        
                    }
                });
            
            }
            else
            {
                stageRows = await prismaClient.scoutReport.groupBy({
                    by: ['stage'],
                    _count: {
                        stage: true,
                    },
                    where: {
                        teamMatchData: {
                            teamNumber: team,
                            tournamentKey :
                            {
                                in : user.tournamentSource
                            }
                        },
                        scouter :
                        {
                            sourceTeamNumber :
                            {
                                in : user.teamSource
                            }
                        }
                        
                    }
                });
                highNoteRows = await prismaClient.scoutReport.groupBy({
                    by: ['highNote'],
                    _count: {
                        highNote: true,
                    },
                    where: {
                        teamMatchData: {
                           
                            teamNumber: team,
                            tournamentKey :
                            {
                                in : user.tournamentSource
                            }
                        },
                        scouter :
                        {
                            sourceTeamNumber :
                            {
                                in : user.teamSource
                            }
                        }
                        
                    }
                });
            }
        }

        const totalAttemptsStage = stageRows.reduce((total, item) => {
            if (item.stage !== "NOTHING") {
                return total + item._count.stage;
            }
            return total;
        }, 0);
        highNoteRows = await prismaClient.scoutReport.groupBy({
            by: ['highNote'],
            _count: {
                highNote: true,
            },
            where: {
                teamMatchData: {
                    tournamentKey: {
                        in: user.tournamentSource
                    },
                    teamNumber: team,
                },
                scouter: {
                    sourceTeamNumber: {
                        in: user.teamSource
                    }
                }
            }
        });
        if (totalAttemptsStage === 0) {
            //can be tuned, baseline value
            return 1.5
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
        let onstage = ((stageMap["ONSTAGE"] + 1) / (totalAttemptsStage + 3)) * 3
        if (isNaN(onstage)) {
            onstage = 1
        }
        let onstageHarmony = ((stageMap["ONSTAGE_HARMONY"] || 0 + 1) / (totalAttemptsStage + 3)) * 5
        if (isNaN(onstageHarmony)) {
            onstageHarmony = 1
        }
        let park = ((stageMap["PARK"] + 1) / (totalAttemptsStage + 2))
        if (isNaN(park)) {
            park = 1
        }
        let averageRuleOfSucsession = onstage + onstageHarmony + park
        if (totalAttempsHighNote !== 0) {
            const highNoteMap = highNoteRows.reduce((map, item) => {
                map[item.highNote] = item._count.highNote;
                return map;
            }, {});
            const highNote = (highNoteMap["SUCCESSFUL"] + 1) / (totalAttempsHighNote + 4)
            averageRuleOfSucsession += highNote
        }
        return averageRuleOfSucsession



    }
    catch (error) {
        console.log(error)
        throw (error)
    }




}






