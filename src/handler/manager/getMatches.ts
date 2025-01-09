import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import { MatchTypeEnumToFull, MatchTypeToAbrivation, ReverseMatchTypeMap, ReverseScouterScheduleMap, ScouterScheduleMap } from "./managerConstants";
import { MatchType, Prisma } from "@prisma/client";

/**
 * @param params.tournament tournament to pull from
 * @param query.isScouted optional - whether to include scouted ("finished") or non scouted ("upcoming") matches (defaults to both)
 * @param query.teams optional - limit to matches containing all these teams
 * 
 * @returns list of matches organized by number and type, with data for team numbers, scouts, and external reports
 */
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
       
        // Check that matches from a tournament exist; if not, add them
        const matchRows = await prismaClient.teamMatchData.findFirst({
            where:
            {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (!matchRows) {
            await addTournamentMatches(params.data.tournamentKey)
        }

        // Assuming all elimination matches are not scouted, find the last scouted match
        const lastScoutedMatch = await prismaClient.teamMatchData.findFirst({
            where: {
                tournamentKey: params.data.tournamentKey,
                matchType: MatchType.QUALIFICATION,
                scoutReports: {
                    some: {
                        scouter: {
                            sourceTeamNumber: {
                                in: user.teamSource
                            }
                        }
                    }
                }
            },
            orderBy: [{matchNumber: "desc"}],
            select: {
                matchNumber: true
            }
        })

        // By default, there should be no filter
        let teamKeyFilter: Prisma.StringFilter<"TeamMatchData"> = undefined;

        // If team filters are set, limit matches to those including at least one of the selected teams
        if (params.data.teamNumbers && params.data.teamNumbers.length > 0) {
            const acceptedMatches = await prismaClient.teamMatchData.groupBy({
                by: ["matchType", "matchNumber"],
                where: {
                    tournamentKey: params.data.tournamentKey,
                    teamNumber: {
                        in: params.data.teamNumbers
                    }
                }
            });

            // Create list of keys 
            const acceptedKeys = acceptedMatches.reduce((acc, cur) => {
                const char = cur.matchType.charAt(0).toLowerCase();

                const base = `${params.data.tournamentKey}_${char}m${cur.matchNumber}_`

                acc.push(base + 0);
                acc.push(base + 1);
                acc.push(base + 2);
                acc.push(base + 3);
                acc.push(base + 4);
                acc.push(base + 5);

                return acc;
            }, []);

            teamKeyFilter = {
                in: acceptedKeys
            }
        }

        // Fetch data for matches and attach not/scouted flags based on request
        // Marks later matches as not scouted/upcoming and earlier ones as scouted/complete
        let matchKeyAndNumber: {matchType: MatchType, matchNumber: number, teamNumber: number, scouted: boolean}[] = []
        if (params.data.isScouted === null || params.data.isScouted === undefined) {
            const allData = await prismaClient.teamMatchData.findMany({
                where: {
                    tournamentKey: params.data.tournamentKey,
                    key: teamKeyFilter
                },
                select: {
                    matchType: true,
                    matchNumber: true,
                    teamNumber: true
                },
                // Sort by matchType, then matchNumber
                orderBy: [
                    { matchType: 'asc' },
                    { matchNumber: 'asc' }
                ]
            });

            // Elimination matches and matches after last scouted match count as upcoming
            matchKeyAndNumber = allData.map(match => {
                if (match.matchType === MatchType.ELIMINATION || match.matchNumber > lastScoutedMatch.matchNumber) {
                    return {...match, scouted: false};
                }
                return {...match, scouted: true};
            });

        } else if (params.data.isScouted) {
            const scoutedData = await prismaClient.teamMatchData.findMany({
                where: {
                    tournamentKey: params.data.tournamentKey,
                    matchType: MatchType.QUALIFICATION,
                    matchNumber: {
                        lte: lastScoutedMatch.matchNumber
                    },
                    key: teamKeyFilter
                },
                select: {
                    matchType: true,
                    matchNumber: true,
                    teamNumber: true
                },
                // Sort by matchType, then matchNumber
                orderBy: [
                    { matchType: 'asc' },
                    { matchNumber: 'asc' }
                ]
            });

            // Qualification matches before last scouted match count as finished
            matchKeyAndNumber = scoutedData.map(match => ({...match, scouted: true}));

        } else {
            // Elimination matches and matches after last scouted match count as upcoming
            const nonScoutedData = await prismaClient.teamMatchData.findMany({
                where: {
                    tournamentKey: params.data.tournamentKey,
                    OR: [
                        {
                            matchType: MatchType.ELIMINATION
                        },
                        {
                            matchNumber: {
                                gt: lastScoutedMatch.matchNumber
                            }
                        }
                    ],
                    key: teamKeyFilter
                },
                select: {
                    matchType: true,
                    matchNumber: true,
                    teamNumber: true
                },
                // Sort by matchType, then matchNumber
                orderBy: [
                    { matchType: 'asc' },
                    { matchNumber: 'asc' }
                ]
            });

            // Elimination matches and matches after last scouted match count as upcoming
            matchKeyAndNumber = nonScoutedData.map(match => ({...match, scouted: false}));
        }


        const finalFormatedMatches = []
        //change into proper format once we know all the matches we are including
        for (const element of matchKeyAndNumber) {
            let currMatch = await prismaClient.teamMatchData.findMany({
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
            //sort by 0, 1, 2, 3, 4, 5 in case its out of order
            currMatch = currMatch.sort((a, b) => {
                const lastDigitA = parseInt(a.key[a.key.length - 1]);
                const lastDigitB = parseInt(b.key[b.key.length - 1]);
                return lastDigitA - lastDigitB;
            });
            const currData = {
                tournamentKey: params.data.tournamentKey, matchNumber: element.matchNumber, matchType: ReverseMatchTypeMap[element.matchType], scouted: element.scouted,
                team1: { number: currMatch[0].teamNumber, alliance: "red", scouters: [], externalReports : 0},
                team2: { number: currMatch[1].teamNumber, alliance: "red", scouters: [], externalReports : 0 },
                team3: { number: currMatch[2].teamNumber, alliance: "red", scouters: [], externalReports : 0},
                team4: { number: currMatch[3].teamNumber, alliance: "blue", scouters: [], externalReports : 0},
                team5: { number: currMatch[4].teamNumber, alliance: "blue", scouters: [], externalReports : 0},
                team6: { number: currMatch[5].teamNumber, alliance: "blue", scouters: [], externalReports : 0},

            }
            finalFormatedMatches.push(currData)
        };

        //get all matches for ordinal number calculation
        const qualDataCount = await prismaClient.teamMatchData.count({
            where:
            {
                tournamentKey: params.data.tournamentKey,
                matchType: "QUALIFICATION"
            }
        })
        if (qualDataCount === 0) {
            res.status(404).send("The match schedule for this tournament hasn't been posted yet.")
            return;
        }
        const lastQualMatch = qualDataCount / 6;

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
                for (const match of finalFormatedMatches) {
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
            for (const match of finalFormatedMatches) {
                promises.push(addExternalReports(req, match))
            }
        }

        await Promise.all(promises);


        res.status(200).send(finalFormatedMatches);
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
