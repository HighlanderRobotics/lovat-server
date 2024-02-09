import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { date, number } from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import prisma from "../../prismaClient";
import { findSourceMap } from "node:module";
import { match } from "node:assert";
import { MatchTypeMap, MatchTypeToAbrivation, ReverseMatchTypeMap, ReverseScouterScheduleMap } from "./managerConstants";
import { nonEventMetric } from "../analysis/coreAnalysis/nonEventMetric";


export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        let teams = null
        let isScouted = null
        //type check, convert isScouted to a boolean
        if (req.query.isScouted != undefined) {
            isScouted = req.query.isScouted === 'true'
        }
        if (req.query.teams != undefined) {
            teams = JSON.parse(req.query.teams as string);
        }
        const params = z.object({
            tournamentKey: z.string(),
            teamNumbers: z.array(z.number()).nullable(),
            isScouted: z.boolean().nullable()
        }).safeParse({
            tournamentKey: req.params.tournament,
            teamNumbers: teams,
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


        //find scouted matches (using sourceTeam and isScouted )
        //get all matches regarless for ordinal number calculation later on
        let qualMatches = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: params.data.tournamentKey,
                matchType: "QUALIFICATION"
            },
            orderBy:
            {
                teamNumber: 'asc'
            }
        })
        if (!qualMatches) {
            res.status(404).send("qualification matches not found")
        }
        let lastQualMatch = Number(qualMatches.length / 6)
  
        //find non scouted matches (not scouted from user.sourceTeam)
        let notScouted = await prismaClient.teamMatchData.findMany({
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
            orderBy: [
                { matchType: 'desc' },
                { matchNumber: 'asc' }
            ]

        })
        //check to make sure each match has 6 rows, if not than 1 + rows have been scouted already
        const groupedMatches = await notScouted.reduce((acc, match) => {
            const key = `${match.matchNumber}-${match.matchType}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(match);
            return acc;
        }, {});

        // find matches with less than 6 rows
        const groupsToKeep = Object.keys(groupedMatches)
            .filter(key => groupedMatches[key].length >= 6);


        // remove unwanted matches
        let nonScoutedMatches = notScouted.filter(match => {
            const key = `${match.matchNumber}-${match.matchType}`;
            return groupsToKeep.includes(key);
        });
       


        let scoutedMatches = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: params.data.tournamentKey,
                key:
                {
                    notIn: nonScoutedMatches.map(item => item.key)
                }
            }
        })
        //get just the matchNumber + matchType for matches scouted and unscouted speratly
        let matchKeyAndNumber = []
        if (params.data.isScouted === null || params.data.isScouted === undefined || params.data.isScouted) {


            let matchKeyAndNumberScouted = await prismaClient.teamMatchData.groupBy({
                by: ["matchNumber", "matchType"],
                where: {
                    tournamentKey: params.data.tournamentKey,
                    key: {
                        in: scoutedMatches.map(item => item.key)
                    },
                },
                orderBy: [
                    { matchType: 'desc' },
                    { matchNumber: 'asc' }
                ]

            })
            matchKeyAndNumber = matchKeyAndNumber.concat(matchKeyAndNumberScouted.map(match => ({ ...match, scouted: true })))
        }
        if (params.data.isScouted === null || params.data.isScouted === undefined || !params.data.isScouted) {

            let matchKeyAndNumberUnScouted = await prismaClient.teamMatchData.groupBy({
                by: ["matchNumber", "matchType"],
                where: {
                    tournamentKey: params.data.tournamentKey,
                    key: {
                        in: nonScoutedMatches.map(item => item.key),
                    },

                },
                orderBy: [
                    { matchType: 'asc' },
                    { matchNumber: 'asc' }
                ]


            })
            matchKeyAndNumber =  matchKeyAndNumber.concat(matchKeyAndNumberUnScouted.map(match => ({ ...match, scouted: false })))

        }
        //assuming scouted matches always come before non scouted, add sort to comfim that
        let finalMatches = []
        if (params.data.teamNumbers && params.data.teamNumbers.length > 0 && params.data.teamNumbers.length <= 6) {
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
        else if (params.data.teamNumbers === null || params.data.teamNumbers === undefined || params.data.teamNumbers.length === 0) {
            finalMatches = matchKeyAndNumber
        }
        //sort
        finalMatches.sort((a, b) => {
            if (a.matchType < b.matchType) return 1;
            if (a.matchType > b.matchType) return -1;
            return a.matchNumber - b.matchNumber;
          });
          
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
                tournamentKey: params.data.tournamentKey, matchNumber: element.matchNumber, matchType: ReverseMatchTypeMap[element.matchType], scouted: element.scouted,
                team1: { number: currMatch[0].teamNumber, alliance: "red", scouters: [] },
                team2: { number: currMatch[1].teamNumber, alliance: "red", scouters: [] },
                team3: { number: currMatch[2].teamNumber, alliance: "red", scouters: [] },
                team4: { number: currMatch[3].teamNumber, alliance: "blue", scouters: [] },
                team5: { number: currMatch[4].teamNumber, alliance: "blue", scouters: [] },
                team6: { number: currMatch[5].teamNumber, alliance: "blue", scouters: [] },

            }
            finalFormatedMatches.push(currData)
        };
        if (user.teamNumber) {
            const scouterShifts = await prismaClient.scouterScheduleShift.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    sourceTeamNumber: user.teamNumber
                },
                orderBy: [

                    { startMatchOrdinalNumber: 'asc' },
                ],
                include:
                {
                    team1: true,
                    team2: true,
                    team3: true,
                    team4: true,
                    team5: true,
                    team6: true
                }
            })
            if (scouterShifts.length !== 0) {

                for (const element of finalFormatedMatches) {
                    let scoutersExist = true
                    //if its an elimination match get the ordinal number, so that we can compare it to the scouterShift start/end
                    let matchNumber = element.matchNumber
                    if (element.matchType === 1) {
                        matchNumber += lastQualMatch
                    }
                    //move onto correct shift
                    let currIndex = 0
                    while (scouterShifts[currIndex].endMatchOrdinalNumber < matchNumber) {
                        currIndex += 1
                        if (currIndex >= scouterShifts.length) {
                            scoutersExist = false
                            break
                        }

                    }
                    if (scoutersExist && scouterShifts[currIndex].startMatchOrdinalNumber > matchNumber) {
                        scoutersExist = false
                    }
                    if (scoutersExist) {
                        await addScoutedTeam(scouterShifts, currIndex, "team1", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team2", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team3", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team4", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team5", element)
                        await addScoutedTeam(scouterShifts, currIndex, "team6", element)
                    }
                    else {
                        await addScoutedTeamNotOnSchedule("team1", element)
                        await addScoutedTeamNotOnSchedule("team2", element)
                        await addScoutedTeamNotOnSchedule("team3", element)
                        await addScoutedTeamNotOnSchedule("team4", element)
                        await addScoutedTeamNotOnSchedule("team5", element)
                        await addScoutedTeamNotOnSchedule("team6", element)
                    }



                }
            }



        }
        res.status(200).send(finalFormatedMatches);
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};
//problem: will push to all 6 teams 
async function addScoutedTeamNotOnSchedule(team, match, scouterShifts = null, currIndex = -1) {
    try {
        let key = match.tournamentKey + "_" + MatchTypeToAbrivation[match.matchType] + match.matchNumber + "_" + ReverseScouterScheduleMap[team]
        if (scouterShifts !== null && currIndex !== -1) {
            const rows = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        key : key
                    },
                    scouterUuid: {
                        notIn: scouterShifts[currIndex][team].map(item => item.uuid)
                    }
                },
                include:
                {
                    scouter: true
                }
            })
            for (let scoutReport of rows) {
                await match[team].scouters.push({ name: scoutReport.scouter.name, scouted: true })
            }
        }
        else {
            const rows = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        key : key
                    }
                },
                include:
                {
                    scouter: true
                }
            })

            for (let scoutReport of rows) {
                await match[team].scouters.push({ name: scoutReport.scouter.name, scouted: true })
            }
        }
    }
    catch (error) {
        throw (error)
    }
}

async function addScoutedTeam(scouterShifts, currIndex, team, match) {
    try {

        for (const scouter of scouterShifts[currIndex][team]) {
            const row = await prismaClient.scoutReport.findFirst({
                where:
                {
                    scouterUuid: scouter.uuid,
                    teamMatchData:
                    {
                        matchNumber: match.matchNumber,
                        tournamentKey: match.tournamentKey,
                        matchType: MatchTypeMap[match.matchType][0]
                    }
                }

            })
            if (row !== null) {
                await match[team].scouters.push({ name: scouter.name, scouted: true })
            }
            else {
                await match[team].scouters.push({ name: scouter.name, scouted: false })
            }
        }
        await addScoutedTeamNotOnSchedule(team, match, scouterShifts, currIndex)

    }
    catch (error) {
        throw (error)
    }
}
