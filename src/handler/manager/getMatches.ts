import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { date, number } from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import prisma from "../../prismaClient";
import { findSourceMap } from "node:module";


export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        let isScouted = null
        //type check, convert isScouted to a boolean
        if (req.query.isScouted != undefined) {
            isScouted = req.query.isScouted === 'true'
        }
        const params = z.object({
            tournamentKey: z.string(),
            teamNumbers: z.array(z.number()),
            isScouted: z.boolean().nullable()
        }).safeParse({
            tournamentKey: req.params.tournament,
            teamNumbers: JSON.parse(req.query.teams as string),
            isScouted: isScouted
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        //get matches from tournament, check that tournament has been inserted. If not add it
        const matchRows = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (matchRows.length === 0) {
            await addTournamentMatches(params.data.tournamentKey)
        }


        //find scouted matches (using user setting)
        let matches = []
        if (params.data.isScouted === null) {
            matches = await prismaClient.teamMatchData.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                },
                orderBy : 
                {
                    teamNumber : 'asc'
                }
            })
            if (!matches) {
                res.status(404).send("matches not found")
            }
        }
        else if (params.data.isScouted) {

            matches = await prismaClient.teamMatchData.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    scoutReports:
                    {
                        some: {
                            scouter:
                            {
                                sourceTeamNumber: {
                                    in: req.user.teamSource
                                }
                            }
                        }
                    }
                },
                orderBy : 
                {
                    teamNumber : 'asc'
                }
                
            })
        }
        //find non scouted matches (not scouted from user.sourceTeam)
        else {

            matches = await prismaClient.teamMatchData.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    scoutReports:
                    {
                        none: {
                            scouter:
                            {
                                sourceTeamNumber: {
                                    in: user.teamSource
                                }
                            }
                        }
                    }
                },
                orderBy : 
                {
                    teamNumber : 'asc'
                }
            })


        }
        //get just the matchNumber + matchType for included matches so far
        let matchKeyAndNumber = await prismaClient.teamMatchData.groupBy({
            by: ["matchNumber", "matchType"],
            where: {
                tournamentKey: params.data.tournamentKey,
                key: {
                    in: matches.map(item => item.key)
                }
            },
        })
        //filter out matches by if they include all the teams the user wants to see or not
        let finalMatches = []
        if (params.data.teamNumbers !== null && params.data.teamNumbers.length > 0 && params.data.teamNumbers.length <= 6) {
            for (let i = 0; i < matchKeyAndNumber.length; i++) {
                let currMatch = await prismaClient.teamMatchData.findMany({
                    where: {
                        matchNumber: matchKeyAndNumber[i].matchNumber,
                        matchType: matchKeyAndNumber[i].matchType,
                        tournamentKey: params.data.tournamentKey
                    }
                })
                let currMatchTeamNumbers = currMatch.map(match => match.teamNumber);
                let allTeamsPresent = params.data.teamNumbers.every(teamNumber =>
                    currMatchTeamNumbers.includes(teamNumber)
                );
                if (allTeamsPresent) {
                    finalMatches.push(matchKeyAndNumber[i])
                }
            }


        }
        else if (params.data.teamNumbers.length === 0) {
            finalMatches = matchKeyAndNumber
        }
        const finalFormatedMatches = []
        //change into proper format once we know all the matches we are including
        for (const element of finalMatches) {
            const currMatch = await prismaClient.teamMatchData.findMany({
                where:
                {
                    matchNumber: element.matchNumber,
                    matchType: element.matchType,
                    tournamentKey: params.data.tournamentKey
                },
            })
            if (currMatch.length != 6) {
                res.status(400).send(`Matches not added correctly, does not have 6 teams for match ${element.matchNumber} of type ${element.matchType}`)
                return
            }
            let currData = {
                tournamentKey: params.data.tournamentKey, matchNumber: element.matchNumber, matchType: element.matchType,
                team1: { number: currMatch[0].teamNumber, alliance: "red", scouters: [] },
                team2: { number: currMatch[1].teamNumber, alliance: "red", scouters: [] },
                team3: { number: currMatch[2].teamNumber, alliance: "red", scouters: [] },
                team4: { number: currMatch[3].teamNumber, alliance: "blue", scouters: [] },
                team5: { number: currMatch[4].teamNumber, alliance: "blue", scouters: [] },
                team6: { number: currMatch[5].teamNumber, alliance: "blue", scouters: [] },

            }
            finalFormatedMatches.push(currData)
        };
        finalFormatedMatches.sort((a, b) => a.matchNumber - b.matchNumber);
        if (user.teamNumber != null) {
            const scouterShifts = await prismaClient.scouterScheduleShift.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    sourceTeamNumber: user.teamNumber
                }
            })
            let currIndex = 0
            if (scouterShifts.length !== 0) {


                for (const element of finalFormatedMatches) {
                    let scoutersExist = true

                    while (scouterShifts[currIndex].endMatchOrdinalNumber < element.matchNumber) {
                        currIndex += 1
                        if (currIndex >= scouterShifts.length) {
                            scoutersExist = false
                            break
                        }

                    }
                    if(scoutersExist)
                    {
                        await addScoutedTeam(scouterShifts, currIndex, "team1", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team2", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team3", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team4", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team5", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team6", element)
                    }
                    else
                    {
                        break
                    }
                   

                }
            }



        }
        res.status(200).send(finalFormatedMatches);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


async function addScoutedTeam(scouterShifts, currIndex, team, match) {
    for (const scouterUuid of scouterShifts[currIndex][team]) {
        const scouter = await prismaClient.scouter.findUnique({
            where:
            {
                uuid: scouterUuid
            }
        })
        match[team].scouters.push(scouter.name)
    }
}
