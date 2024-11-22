//importing necessary things from other files like prisma, zod, authentication, maps
import { Response } from "express";
import prismaClient from '../../prismaClient'
import { match } from "assert";
import z from 'zod'
import { singleMatchSingleScoutReport } from "../analysis/coreAnalysis/singleMatchSingleScoutReport";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { EventAction } from "@prisma/client";
import { ADDRGETNETWORKPARAMS } from "dns";
import { PickUpMap, PositionMap, MatchTypeMap, HighNoteMap, StageResultMap, RobotRoleMap, EventActionMap} from "./managerConstants";
import { addTournamentMatches } from "./addTournamentMatches";
import { totalPointsScoutingLead } from "../analysis/scoutingLead/totalPointsScoutingLead";


export const addScoutReportDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        //type verification
        const paramsScoutReport = z.object({
            uuid : z.string(),
            startTime: z.number(),
            notes: z.string(),
            robotRole: z.enum(["OFFENSE",
                "DEFENSE",
                "FEEDER",
                "IMMOBILE"]),
            stage: z.enum(["NOTHING",
                "PARK",
                "ONSTAGE",
                "ONSTAGE_HARMONY"
            ]),
            highNote: z.enum(["NOT_ATTEMPTED", "FAILED", "SUCCESSFUL"]),
            pickUp: z.enum(["GROUND", "CHUTE", "BOTH"]),

            driverAbility: z.number(),
            scouterUuid: z.string(),
            matchType : z.enum(["QUALIFICATION", "ELIMINATION"]),
            matchNumber : z.number(),
            tournamentKey : z.string(),
            teamNumber : z.number()
        }).safeParse({
            uuid : req.body.uuid,
            scouterUuid: req.body.scouterUuid,
            startTime: req.body.startTime,
            notes: req.body.notes,
            robotRole:  RobotRoleMap[req.body.robotRole][0],
            driverAbility:  req.body.driverAbility,
            highNote:  HighNoteMap[req.body.highNote][0],
            pickUp:  PickUpMap[req.body.pickUp][0],
            stage:  StageResultMap[req.body.stage][0],
            matchType : MatchTypeMap[req.body.matchType][0],
            matchNumber : req.body.matchNumber,
            teamNumber : req.body.teamNumber,
            tournamentKey : req.body.tournamentKey
        })
        if (!paramsScoutReport.success) {
            res.status(400).send({"error" : paramsScoutReport, "displayError" : "Invalid input. Make sure you are using the correct input."});
            return;
        };
        //getting scouter uuid
        const scouter = await prismaClient.scouter.findUnique({
            where :
            {
                uuid : paramsScoutReport.data.scouterUuid
            }
        })
        //making sure "scouter" is a valid scouter
        if(!scouter)
        {
            res.status(400).send({"error" : `This ${paramsScoutReport.data.scouterUuid} has been deleted or never existed.`, "displayError" : "This scouter has been deleted. Have the scouter reset their settings and choose a new scouter."})
            return
        }
        //making sure the team number exists and is the same as the scource team number
        if(req.user.teamNumber === null || scouter.sourceTeamNumber !== req.user.teamNumber )
        {
            res.status(401).send({error : `User with the id ${req.user.id} is not on the same team as the scouter with the uuid ${scouter.uuid}`, displayError : "Not on the same team as the scouter."})
            return
        }
        //getting the row in the scout report table to make sure it doesn't already exist
        const scoutReportUuidRow = await prismaClient.scoutReport.findUnique({
            where :
            {
                uuid : paramsScoutReport.data.uuid
            }
        })
        if(scoutReportUuidRow)
        {
            res.status(400).send({"error" : `The scout report uuid ${paramsScoutReport.data.uuid} already exists.`, "displayError" : "Scout report already uploaded"})
            return
        }
        
        //getting the rows in teamMatchData where the tournament key is the tournament key of the user
        const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
            where :
            {
                tournamentKey : paramsScoutReport.data.tournamentKey
            }
        })
        //checking length of tournamentMatchRows and calling addTournamentMatches if there are no rows
        if(tournamentMatchRows === null || tournamentMatchRows.length === 0)
        {
            await addTournamentMatches(paramsScoutReport.data.tournamentKey)
        }
        //getting the first row with the desired tournament key, match number, match type, and team number
        const matchRow = await prismaClient.teamMatchData.findFirst({
            where :
            {
                tournamentKey : paramsScoutReport.data.tournamentKey,
                matchNumber : paramsScoutReport.data.matchNumber,
                matchType : paramsScoutReport.data.matchType,
                teamNumber : paramsScoutReport.data.teamNumber
            }
        })
        //if there are no matches that meet ^^^ requirement
        if(!matchRow)
        {
            res.status(404).send({"error" : `There are no matches that meet these requirements. ${paramsScoutReport.data.tournamentKey}, ${paramsScoutReport.data.matchNumber}, ${paramsScoutReport.data.matchType}, ${paramsScoutReport.data.teamNumber}`, "displayError" : "Match does not exist"})
            return
        }
        const matchKey = matchRow.key
        //adding a scout report to scout report table
        const row = await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    uuid : paramsScoutReport.data.uuid,
                    teamMatchKey: matchKey,
                    startTime: new Date(paramsScoutReport.data.startTime),
                    scouterUuid: paramsScoutReport.data.scouterUuid,
                    notes: paramsScoutReport.data.notes,
                    robotRole: paramsScoutReport.data.robotRole,
                    driverAbility: paramsScoutReport.data.driverAbility,
                    //game specfific
                    highNote: paramsScoutReport.data.highNote,
                    stage: paramsScoutReport.data.stage,
                    pickUp: paramsScoutReport.data.pickUp
                
                }
            }
        )
        const scoutReportUuid = row.uuid
        const eventDataArray = []
        const events = req.body.events;
        //setting default amp to not on
        let ampOn = false
        //for every row in events
        for (let i = 0; i < events.length; i++) {
            //setting default points to 0 and position to none and the action to leave
            let points = 0;
            const time = events[i][0];
            const position = PositionMap[events[i][2]][0];
            const action = EventActionMap[events[i][1]][0]
            //changing ampOn status to true if amplication period started
            if (action === "START") {
                ampOn = true
            }
            //changing ampOn status to false if amplification period ended
            else if (action === "STOP") {
                ampOn = false
            }
            //if in the auto period...
            else if (time <= 18) {
                // a robot scores...
                if (action === "SCORE") {
                    //in the amp updates points to 2
                    if (position === "AMP") {
                        points = 2
                    }
                    //in the speaker updates points to 5
                    else if (position === "SPEAKER") {
                        points = 5
                    }
                }
                // a robot leaves updates points to 2
                else if (action === "LEAVE") {
                    points = 2
                }
            }
            //if not in auto period (in teleop)...
            else {
                //a robot scores...
                if (action === "SCORE") {
                    //in the amp updates points to 1
                    if (position === "AMP") {
                        points = 1
                    }
                    //in the speaker and the amp is on update points to 5
                    else if (position === "SPEAKER" && ampOn) {
                        points = 5
                    }
                    //in the speaker and the amp is not on update points to 2
                    else if (position === "SPEAKER") {
                        points = 2
                    }
                    //in the trap updates points to 5
                    else if (action === "TRAP") {
                        points = 5
                    }
                }
            }
            //if the action stop and start are both not true
            if (action !== "START" && action !== "STOP") {
                //type verification
                const paramsEvents = z.object({
                    time: z.number(),
                    action: z.enum(["DEFENSE", "SCORE", "PICK_UP", "LEAVE", "DROP_RING", "FEED_RING", "STARTING_POSITION"]),
                    position: z.enum(["NONE", "AMP", "SPEAKER", "TRAP", "WING_NEAR_AMP", "WING_FRONT_OF_SPEAKER", "WING_CENTER", "WING_NEAR_SOURCE", "GROUND_NOTE_ALLIANCE_NEAR_AMP", "GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER", "GROUND_NOTE_ALLIANCE_BY_SPEAKER", "GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE", "GROUND_NOTE_CENTER_TOWARD_AMP_SIDE", "GROUND_NOTE_CENTER_CENTER", "GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE", "GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE"]),
                    points: z.number(),
                    scoutReportUuid: z.string()
                }).safeParse({
                    scoutReportUuid: scoutReportUuid,
                    time: time,
                    action: action,
                    position: position,
                    points: points
                })
                if (!paramsEvents.success) {
                    res.status(400).send({"error" : paramsEvents, "displayError" : "Invalid input. Make sure you are using the correct input."});
                    return;
                };
                //push time, action, position, points, scoutReportUuid 
                eventDataArray.push( {
                        time: paramsEvents.data.time,
                        action: paramsEvents.data.action,
                        position: paramsEvents.data.position,
                        points: paramsEvents.data.points,
                        scoutReportUuid: scoutReportUuid
                })
                
            }
        }
        //create all rows pushed from eventDataArray
        await prismaClient.event.createMany({
            data : eventDataArray
        })
        const totalPoints = await totalPointsScoutingLead(scoutReportUuid)
        //recalibrate the max resonable points for every year 
        //uncomment for scouting lead page
        // if (totalPoints === 0 || totalPoints > 80) {
        //     await prismaClient.flaggedScoutReport.create({
        //         data:
        //         {
        //             note: `${totalPoints} recorded, not including endgame`,
        //             scoutReportUuid: scoutReportUuid
        //         }

        //     })
        // }
        res.status(200).send('done adding data');
    }

    catch (error) {
        console.log(error)
        res.status(500).send({"error" : error, "displayError" : "Error"});

    }
}


