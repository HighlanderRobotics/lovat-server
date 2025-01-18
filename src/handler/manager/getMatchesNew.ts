import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import { MatchTypeEnumToFull, MatchTypeToAbrivation, ReverseMatchTypeMap, ReverseScouterScheduleMap, ScouterScheduleMap } from "./managerConstants";
import { MatchType, Prisma, TeamMatchData } from "@prisma/client";

/**
 * @param params.tournament tournament to pull from
 * @param query.isFinished optional - whether to include finished or upcoming matches (defaults to both)
 * @param query.teams optional - limit to matches containing all these teams
 *
 * @returns list of matches organized by number and type, with data for teams/scouts/external reports
 */
export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        let teams = null;
        if (req.query.teams != undefined) {
            teams = JSON.parse(req.query.teams as string);
        }
        const params = z.object({
            tournamentKey: z.string(),
            teamNumbers: z.array(z.number()).nullable(),
        }).safeParse({
            tournamentKey: req.params.tournament,
            teamNumbers: teams
        });
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        if (params.data.teamNumbers && params.data.teamNumbers.length > 6) {
            res.status(400).send("Too many team filters");
            return;
        }

        // Check that matches from a tournament exist; if not, add them
        const matchRow = await prismaClient.teamMatchData.findFirst({
            where: {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (!matchRow) {
            await addTournamentMatches(params.data.tournamentKey);
        }

        // Assuming all elimination matches are not scouted, find the last scouted match
        const lastFinishedMatch = await prismaClient.teamMatchData.findFirst({
            where: {
                tournamentKey: params.data.tournamentKey,
                matchType: MatchType.QUALIFICATION,
                scoutReports: {
                    some: {}
                }
            },
            orderBy: [{matchNumber: "desc"}],
            select: {
                matchNumber: true
            }
        });

        const rawData = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey: params.data.tournamentKey
            },
            select: {
                matchNumber: true,
                matchType: true,
                teamNumber: true,
                key: true,
                _count: {
                    select: {
                        scoutReports: {
                            where: {
                                scouter: {
                                    sourceTeamNumber: {
                                        in: user.teamSource
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Group teamMatchData by match
        let groupedData: { matchNumber: number, teamNumber: number, matchType: MatchType, _count: { scoutReports: number }}[][] = rawData.reduce((acc, curr) => {
            // Positive indices are quals, negatives are elims
            const i = curr.matchNumber * (curr.matchType === MatchType.ELIMINATION ? -1 : 1)
            acc[i] ??= [];
            // Order match by team index [0-5]
            acc[i][Number(curr.key.at(-1))] = curr;
            return acc;
        }, [])

        const lastQualMatch = groupedData.length - 1;

        // If team filters are set, limit matches to those including all selected teams
        if (params.data.teamNumbers && params.data.teamNumbers.length > 0) {
            let tempArray: typeof groupedData;
            
            // For..in to iterate over positive and negative properties
            for (const k in groupedData) {
                const i = parseInt(k);
                const match = groupedData[i];
                if (match.every(team => params.data.teamNumbers.includes(team.teamNumber))) {
                    tempArray[i] = match;
                }
            }

            groupedData = tempArray;
        }

        // Fetch data for matches and attach scouted and finished flags
        const finalFormattedMatches: {
            matchNumber: number, matchType: number, scouted: boolean, finished: boolean,
            team1: {number: number, alliance: string, scouters: any[], externalReports: number},
            team2: {number: number, alliance: string, scouters: any[], externalReports: number},
            team3: {number: number, alliance: string, scouters: any[], externalReports: number},
            team4: {number: number, alliance: string, scouters: any[], externalReports: number},
            team5: {number: number, alliance: string, scouters: any[], externalReports: number},
            team6: {number: number, alliance: string, scouters: any[], externalReports: number},
        }[] = []

        // For..in should iterate through array indices first, then other properties by insertion order
        // Here, this means qual matches first, then eliminations
        for (const k in groupedData) {
            const i = parseInt(k);
            const match = groupedData[i];
            const currData = {
                matchNumber: match[0].matchNumber,
                matchType: ReverseMatchTypeMap[match[0].matchType],
                scouted: match.some(team => team._count.scoutReports >= 1),
                finished: !(match[0].matchType === MatchType.ELIMINATION || match[0].matchNumber > lastFinishedMatch.matchNumber),
                team1: { number: match[0].teamNumber, alliance: "red", scouters: [], externalReports: 0 },
                team2: { number: match[1].teamNumber, alliance: "red", scouters: [], externalReports: 0 },
                team3: { number: match[2].teamNumber, alliance: "red", scouters: [], externalReports: 0 },
                team4: { number: match[3].teamNumber, alliance: "blue", scouters: [], externalReports: 0 },
                team5: { number: match[4].teamNumber, alliance: "blue", scouters: [], externalReports: 0 },
                team6: { number: match[5].teamNumber, alliance: "blue", scouters: [], externalReports: 0 },
            }

            if (i > 0) {
                finalFormattedMatches[i] = currData;
            } else {
                finalFormattedMatches[lastQualMatch - i] = currData;
            }
        }

        const promises = []
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

                for (const element of finalFormattedMatches) {
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
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team1", element))
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team2", element))
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team3", element))
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team4", element))
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team5", element))
                        promises.push(addScoutedTeam(req, scouterShifts, currIndex, "team6", element))

                    }
                    else {
                        promises.push(addScoutedTeamNotOnSchedule(req, "team1", element))
                        promises.push(addScoutedTeamNotOnSchedule(req, "team2", element))
                        promises.push(addScoutedTeamNotOnSchedule(req, "team3", element))
                        promises.push(addScoutedTeamNotOnSchedule(req, "team4", element))
                        promises.push(addScoutedTeamNotOnSchedule(req, "team5", element))
                        promises.push(addScoutedTeamNotOnSchedule(req, "team6", element))

                    }
                    if(element.scouted)
                    {
                        promises.push(addExternalReports(req, element))
                    }



                }
            }
            else {
                for (const match of finalFormattedMatches) {
                    promises.push(addScoutedTeamNotOnSchedule(req, "team1", match))
                    promises.push(addScoutedTeamNotOnSchedule(req, "team2", match))
                    promises.push(addScoutedTeamNotOnSchedule(req, "team3", match))
                    promises.push(addScoutedTeamNotOnSchedule(req, "team4", match))
                    promises.push(addScoutedTeamNotOnSchedule(req, "team5", match))
                    promises.push(addScoutedTeamNotOnSchedule(req, "team6", match))
                    if(match.scouted)
                    {
                        await addExternalReports(req, match)
                    }
                }

            }



        }
        else {
            for (const match of finalFormattedMatches) {
                promises.push(addExternalReports(req, match))
            }
        }

        await Promise.all(promises);


        res.status(200).send(finalFormattedMatches);
    }
    catch (error) {
        res.status(500).send(error)
    }

}

//problem: will push to all 6 teams
async function addScoutedTeamNotOnSchedule(req: AuthenticatedRequest, team: string, match, scouterShifts = null, currIndex = -1) {
    try {
        const key = match.tournamentKey + "_" + MatchTypeToAbrivation[match.matchType] + match.matchNumber + "_" + ReverseScouterScheduleMap[team]
        if (scouterShifts !== null && currIndex !== -1) {
            const rows = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        key: key
                    },
                    scouterUuid: {
                        notIn: scouterShifts[currIndex][team].map(item => item.uuid)
                    },
                    scouter:
                    {
                        sourceTeamNumber: req.user.teamNumber
                    }
                },
                include:
                {
                    scouter: true
                }
            })
            for (const scoutReport of rows) {
                await match[team].scouters.push({ name: scoutReport.scouter.name, scouted: true })
            }
        }
        else {
            const rows = await prismaClient.scoutReport.findMany({
                where:
                {
                    teamMatchData:
                    {
                        key: key
                    },
                    scouter:
                    {
                        sourceTeamNumber: req.user.teamNumber
                    }
                },
                include:
                {
                    scouter: true
                }
            })

            for (const scoutReport of rows) {
                await match[team].scouters.push({ name: scoutReport.scouter.name, scouted: true })
            }
        }
        return true


    }
    catch (error) {
        throw (error)
    }
}

async function addScoutedTeam(req: AuthenticatedRequest, scouterShifts, currIndex: number, team: string, match) {
    try {
        const key = match.tournamentKey + "_" + MatchTypeToAbrivation[match.matchType] + match.matchNumber + "_" + ReverseScouterScheduleMap[team]
        for (const scouter of scouterShifts[currIndex][team]) {
            const rows = await prismaClient.scoutReport.findMany({
                where:
                {
                    scouterUuid: scouter.uuid,
                    teamMatchKey: key
                }

            })
            if (rows !== null && rows.length > 0) {
                for (const element of rows) {
                    await match[team].scouters.push({ name: scouter.name, scouted: true })
                }
            }
            else {
                await match[team].scouters.push({ name: scouter.name, scouted: false })
            }
        }
        await addScoutedTeamNotOnSchedule(req, team, match, scouterShifts, currIndex)
        return true

    }
    catch (error) {
        throw (error)
    }
}

async function addExternalReports(req: AuthenticatedRequest, match) {
    //don't use null for "not" in prisma below
    const teamNumber = req.user.teamNumber || 0
    const externalReports = await prismaClient.scoutReport.groupBy({
        by : ["teamMatchKey"],
        _count :
        {
            _all : true
        },
        where :
        {
            teamMatchData :
            {
                tournamentKey : match.tournamentKey,
                matchType : MatchTypeEnumToFull[match.matchType],
                matchNumber: match.matchNumber
            },
            scouter :
            {
                sourceTeamNumber :
                {
                    in : req.user.teamSource,
                    not : teamNumber
                }
            }
        }


    })

    externalReports.forEach(externalReport => {
        const team = ScouterScheduleMap[externalReport.teamMatchKey[externalReport.teamMatchKey.length - 1]]
        match[team].externalReports = externalReport._count._all
    });
    return true
}
