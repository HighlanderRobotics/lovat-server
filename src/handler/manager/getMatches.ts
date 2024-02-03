import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { date, number } from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import prisma from "../../prismaClient";
import { findSourceMap } from "node:module";
import { match } from "node:assert";
import { MatchTypeMap, ReverseMatchTypeMap } from "./managerConstants";


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
            teamNumbers: z.array(z.number()).optional(),
            isScouted: z.boolean().nullable()
        }).safeParse({
            tournamentKey: req.params.tournament,
            //must send team numbers, just make it empty
            teamNumbers: req.query.teams ? JSON.parse(req.query.teams as string) : undefined,
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
        let matches = []
        if (params.data.isScouted === null) {
            matches = await prismaClient.teamMatchData.findMany({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                },
                orderBy:
                {
                    teamNumber: 'asc'
                }
            })

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
                orderBy:
                {
                    teamNumber: 'asc'
                }

            })

        }
        else {
            //find non scouted matches (not scouted from user.sourceTeam)
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
                orderBy:
                {
                    teamNumber: 'asc'
                }
            })
            //check to make sure each match has 6 rows, if not than 1 + rows have been scouted already
            const groupedMatches = matches.reduce((acc, match) => {
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
            matches = matches.filter(match => {
                const key = `${match.matchNumber}-${match.matchType}`;
                return groupsToKeep.includes(key);
            });


        }
        //get just the matchNumber + matchType for included matches so far
        let matchKeyAndNumberScouted = await prismaClient.teamMatchData.groupBy({
            by: ["matchNumber", "matchType"],
            where: {
                tournamentKey: params.data.tournamentKey,
                key: {
                    in: matches.map(item => item.key)
                },
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
            }

        })
        let matchKeyAndNumberUnScouted = await prismaClient.teamMatchData.groupBy({
            by: ["matchNumber", "matchType"],
            where: {
                tournamentKey: params.data.tournamentKey,
                key: {
                    in: matches.map(item => item.key),
                },
                AND: [
                    {
                        matchNumber:
                        {
                            notIn: matchKeyAndNumberScouted.map(item => item.matchNumber)
                        }
                    },
                    {
                        matchType:
                        {
                            notIn: matchKeyAndNumberScouted.map(item => item.matchType)
                        }
                    }
                ]
            }


        })
        let matchKeyAndNumber = matchKeyAndNumberUnScouted.map(match => ({ ...match, scouted: false })).concat(matchKeyAndNumberScouted.map(match => ({ ...match, scouted: true })))
        //sort
        matchKeyAndNumber.sort((a, b) => {
            if (a.matchType > b.matchType) return -1;
            if (a.matchType < b.matchType) return 1;
            return a.matchNumber - b.matchNumber;
        });

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
        else if (params.data.teamNumbers === undefined || params.data.teamNumbers.length === 0) {
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
        finalFormatedMatches.sort((a, b) => a.matchNumber - b.matchNumber);
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


async function addScoutedTeam(scouterShifts, currIndex, team, match) {
    try {

        for (const scouter of scouterShifts[currIndex][team]) {
            const row = await prismaClient.scoutReport.findFirst({
                where :
                {
                    scouterUuid : scouter.uuid,
                    teamMatchData :
                    {
                        matchNumber : match.matchNumber,
                        tournamentKey : match.tournamentKey,
                        matchType : MatchTypeMap[match.matchType][9]
                    }
                }

            })
            if(row !== null)
            {
                await match[team].scouters.push({name : scouter.name, scouted : true})
            }
            else
            {
                await match[team].scouters.push({name : scouter.name, scouted : false})
            }
        }

    }
    catch (error) {
        throw (error)
    }
}
