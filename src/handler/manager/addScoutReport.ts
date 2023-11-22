import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { match } from "assert";
import z from 'zod'


export const addScoutReport = async (req: Request, res: Response): Promise<void> => {


    try {
        let matchData = req.body.data;
        let matchKey = req.body.matchKey;
        let scoutReportUuid = req.body.uuid
        const ScoutReportSchema = z.object({
            uuid : z.string(),
            teamMatchKey : z.string(),
            startTime : z.string(),
            notes: z.string(),
            links : z.number(),
            robotRole : z.enum(["OFFENSE",
                "DEFENSE",
                "FEEDER",
                "IMMOBILE"]),
            autoChallengeResult : z.enum([ "NONE",
                "DOCKED",
                "ENGAGED",
                "FAILED",
                "MOBILITY"]),
            teleopChallengeResult : z.enum([ "NONE",
                "DOCKED",
                "ENGAGED",
                "FAILED",
                "IN_COMMUNITY"]),
            penaltyCard : z.enum(["NONE", "YELLOW", "RED"]),
            driverAbility : z.number(),
            scouterUuid : z.string()
        }) 
        const EventSchema = z.object({
            time : z.number(),
            action : z.enum(["PICK_UP_CONE", "PICK_UP_CUBE", "PLACE_OBJECT"]),
            position : z.enum(["NONE", "PLACE_HOLDER"]),
            points : z.number(),
            scoutReportUuid : z.string()
        })

        const currScoutReport = {teamMatchKey: matchKey, scouterUuid: matchData.scouterUuid, startTime: matchData.startTime, notes: matchData.notes, links: matchData.links, robotRole: matchData.robotRole, autoChallengeResult: matchData.autoChallengeResult, challengeResult: matchData.challengeResult, penaltyCard: matchData.penaltyCard, driverAbility: matchData.driverAbility}
        const possibleTypeError = ScoutReportSchema.safeParse(currScoutReport)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const row = await prismaClient.scoutReport.create(
            {
                data: currScoutReport
            }
        )
        //     .insert([
        //     { 'team': team, 'sourceTeam': sourceTeam, 'tournamentKey': tournamentKey, 'match': match, 'scouterUuid': matchData.scouterUuid, 'startTime': matchData.startTime, 'notes': matchData.notes, 'links': matchData.links, 'robotRole': matchData.robotRole, 'autoChallengeResult': matchData.autoChallengeResult, 'challengeResult': matchData.challengeResult, 'penaltyCard': matchData.penaltyCard, 'driverAbility': matchData.driverAbility },
        // ])

        let events = matchData.events;
        for (let i = 0; i < events.length; i++) {
            let points = 0;
            let time = events[i][0];
            let position = events[i][2];
            if (events[i][1] === 2) {
                let level = Math.ceil(position / 3);
                if (time <= 17) {
                    if (level === 1) {
                        points = 3;
                    }
                    else if (level === 2) {
                        points = 4;
                    }
                    else if (level === 3) {
                        points = 6;
                    }
                }
                else {
                    if (level === 1) {
                        points = 2;
                    }
                    else if (level === 2) {
                        points = 3;
                    }
                    else if (level === 3) {
                        points = 5;
                    }
                }
            }
            {
                let currEvent =  
                {
                    scoutReportUuid: scoutReportUuid,
                    time: events[i][0],
                    action: events[i][1],
                    position: events[i][2],
                    points: points

                }
                const possibleTypeError = EventSchema.safeParse(currEvent)
                if (!possibleTypeError.success) {
                    res.status(400).send(possibleTypeError)
                    return
                }
                const row = await prismaClient.event.create(
                    {
                       data : currEvent
                    }
                )


            }
        }
        res.status(200).send('done editing data');
    }

    catch (err) {
        if (err) {
            res.status(400).send(err);
        }
    }
}


