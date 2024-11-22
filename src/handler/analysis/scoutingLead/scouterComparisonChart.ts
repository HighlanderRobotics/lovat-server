import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import prisma from "../../../prismaClient";
import { match } from "assert";


export const scouterComparisonChart = async (req: AuthenticatedRequest, res : Response) => {
    try {
        const params = z.object({
            scouterUuid : z.string(),
            tournamentKey : z.string().optional()
        }).safeParse({
            scouterUuid : req.query.scouterUuid,
            tournamentKey : req.query.tournamentKey
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        let result = {} 
        if (params.data.tournamentKey != null){
            const scoutReportNumberOfEvents = await prisma.event.groupBy({
                by : ["scoutReportUuid", "action"],
                _count : {
                 _all : true
                },
                where : {
                    scoutReport : {
                        teamMatchData : {
                            tournamentKey : params.data.tournamentKey
                        },
                        scouterUuid : params.data.scouterUuid
                    }
                }
            })
            const otherScoutReportNumberOfEvents = await prisma.event.groupBy({
                by : ["scoutReportUuid","action"],
                _count : {
                    _all : true
                },
                where:{
                    scoutReport:{
                        scouterUuid:{
                            not: params.data.scouterUuid
                        },
                        teamMatchData:{
                            tournamentKey : params.data.tournamentKey
                        }
                    }
                }
            })

            let differenceInEventCount=[];
            let hashMap = new Map<String, number>();
            for(let i=0;i<otherScoutReportNumberOfEvents.length;i++){
                for(let j=0;j<scoutReportNumberOfEvents.length;j++){
                    const matchKey1 = await prisma.scoutReport.findUnique({
                        where: {
                            uuid: scoutReportNumberOfEvents[j].scoutReportUuid
                        }
                    })
                    const matchKey2= await prisma.scoutReport.findUnique({
                        where: {
                            uuid: otherScoutReportNumberOfEvents[i].scoutReportUuid
                        }
                    })
                    if(matchKey1.teamMatchKey.localeCompare(matchKey2.teamMatchKey)){
                        if(hashMap.has(matchKey1.teamMatchKey))
                        {
                            let arrayIndex = hashMap.get(matchKey1.teamMatchKey)
                            differenceInEventCount[arrayIndex].difference = differenceInEventCount[arrayIndex].difference + scoutReportNumberOfEvents[j]._count._all - otherScoutReportNumberOfEvents[i]._count._all
                            if (matchKey1.teamMatchKey==='2024casf_qm19_2'){
                                console.log(scoutReportNumberOfEvents[j]._count._all)
                                console.log(otherScoutReportNumberOfEvents[i]._count._all)
                            }
                        }
                        else
                        {
                            differenceInEventCount.push({"difference" : scoutReportNumberOfEvents[j]._count._all - otherScoutReportNumberOfEvents[i]._count._all, "matchKey" : matchKey1.teamMatchKey})
                            hashMap.set(matchKey1.teamMatchKey, differenceInEventCount.length-1);
                        }

                    }
                    console.log(j)
                }
            }
         }
         else{

         }
        
    }
    catch (error) {
        res.status(400).send(error)
    }
};