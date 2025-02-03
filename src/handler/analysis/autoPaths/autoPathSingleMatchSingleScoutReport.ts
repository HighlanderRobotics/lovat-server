import prismaClient from '../../../prismaClient'
import { FlippedActionMap, FlippedPositionMap, autoEnd } from "../analysisConstants";
import { EventAction, User } from "@prisma/client";


export const autoPathSingleMatchSingleScoutReport = async (user: User, matchKey : string, scoutReportUuid : string) => {
    try {
        const autoData = await prismaClient.event.findMany({
            where : 
            {
                scoutReport :
                {
                    uuid : scoutReportUuid
                },
                time : 
                {
                    lte : autoEnd
                },
                action :
                {
                    // All auton-associated event actions/positions
                    in: [
                        EventAction.FAIL_NET,
                        EventAction.PICKUP_ALGAE,
                        EventAction.PICKUP_CORAL,
                        EventAction.SCORE_CORAL,
                        EventAction.SCORE_NET,
                        EventAction.SCORE_PROCESSOR,
                        EventAction.START_POSITION,
                        EventAction.AUTO_LEAVE
                    ]
                }
            
            },
           
           

        })
        const scoutReport = await prismaClient.scoutReport.findUnique({
            where :
            {
                uuid : scoutReportUuid
            }
        })
        const match = await prismaClient.teamMatchData.findUnique({
            where :
            {
                key : scoutReport.teamMatchKey
            },
            include :
            {
                tournament : true
            }
        })
        //GET SCOUT REPORT COLUMNN IF NESSISARY
        const totalScore = autoData.reduce((sum, event) => sum + event.points, 0);
        const positions = autoData.map(event => ({
            location: FlippedPositionMap[event.position],
            event: FlippedActionMap[event.action],
            time: event.time
        }))

        return  {
            autoPoints : totalScore,
            positions : positions,
            match : matchKey,
            tournamentName : match.tournament.name
        }
        
    
    }
    catch (error) {
        console.log(error)
      throw(error)
    }

};