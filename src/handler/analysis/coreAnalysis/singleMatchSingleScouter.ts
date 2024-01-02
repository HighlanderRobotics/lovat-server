import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";



export const singleMatchSingleScouter = async (req: AuthenticatedRequest, metric: string, isPointAverage: boolean, matchKey: string, scouterUuid: string): Promise<number> => {
    try {

        if (isPointAverage) {
            let timeMin = 0
            //could be 150, but putting more for buffer for now
            let timeMax = 200
            if (metric === "teleopPoints") {
                //3 sec inbetween teleop and auto where things are still counted, I will put a 3 sec buffer for now
                //18 and not 17 so it doesnt double count things that happen on the 17 mark when calculating teleop/auto averages (see primsa below)
                timeMin = 18
                metric = "PLACE_OBJECT"
            }
            else if (metric === "autoPoints") {
                timeMax = 17
                metric = "PLACE_OBJECT"
            }

            const params = z.object({
                metric: z.enum(["PICK_UP_CONE",
                    "PICK_UP_CUBE",
                    "PLACE_OBJECT",])
            }).safeParse({
                metric: metric
            })
            if (!params.success) {
                throw (params)
            };
            const sumOfPoints = await prismaClient.event.aggregate({
                _sum:
                {
                    points: true
                },
                where:
                {
                    scoutReport: {
                        teamMatchKey: matchKey,
                        teamMatchData:
                        {
                            //shouldnt be looking at tournaments not in their data set but im just checking
                            //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                            tournamentKey: {
                                in: req.user.tournamentSource
                            }
                        },
                        scouterUuid: scouterUuid
                    },
                    //switch if theirs multiple ways to score (for teleopPoints/autoPoints/totalPoints)
                    action: params.data.metric,
                    time: {
                        gte: timeMin,
                        lte: timeMax
                    }

                }
            })
            //check this is right
            return sumOfPoints[0]._sum
        }



        else {
            //keep update to date with the EventAction in schema.prisma

            const params = z.object({
                metric: z.enum(["PICK_UP_CONE",
                    "PICK_UP_CUBE",
                    "PLACE_OBJECT",])
            }).safeParse({
                metric: metric
            })
            if (!params.success) {
                throw (params)
            };
            const sumOfMatches = await prismaClient.event.groupBy({
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        teamMatchKey: matchKey,
                        teamMatchData:
                        {
                            //shouldnt be looking at tournaments not in their data set but im just checking
                            //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                            tournamentKey: {
                                in: req.user.tournamentSource
                            }
                        },
                        scouterUuid: scouterUuid

                    },
                    action: params.data.metric

                }
            })
            const sum = sumOfMatches.reduce((acc, val) => acc + val._count._all, 0) / sumOfMatches.length;
            return sum

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};