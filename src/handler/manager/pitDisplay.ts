import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { late } from 'zod'
import axios from "axios";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { matchPredictionLogic } from "../analysis/alliancePredictions/matchPredictionLogic";
import { time } from "console";
import { $Enums, MatchType } from "@prisma/client";
import { MatchEnumToAbrivation, MatchTypeEnumToFull, MatchTypeToAbrivation } from "./managerConstants";
import { match } from "assert";
import { addTournamentMatches } from "./addTournamentMatches";


export const pitDisplay = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const params = z.object({
            team: z.number().min(0),
            tournamentKey: z.string(),
            topTeamCount: z.number(),
            teamsAboveCount: z.number()
        }).safeParse({
            team: Number(req.query.team),
            tournamentKey: req.query.tournamentKey,
            topTeamCount: Number(req.query.topTeamCount),
            teamsAboveCount: Number(req.query.teamsAboveCount)
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const data = { "matches": {}, "teamMatchTimeline": {}, "webcasts": null, "rankingBlocks": null }
        // await addTournamentMatches(params.data.tournamentKey)
        const matchesWithTeam = await prismaClient.teamMatchData.findMany({
            where :
            {
                tournamentKey : params.data.tournamentKey,
                teamNumber : params.data.team
            }
        })
        if(matchesWithTeam.length === 0)
        {
            res.status(500).send("Team and tournament do not exist or corrilate")
            return
        }

        const headers = { 'X-TBA-Auth-Key': process.env.TBA_KEY };
        const teamKey = "frc" + params.data.team
        await axios.get(`https://www.thebluealliance.com/api/v3/event/${params.data.tournamentKey}`, { headers })
            .then(async response => {

                data.webcasts = response.data.webcasts
            })
        
        await axios.get(`https://www.thebluealliance.com/api/v3/event/${params.data.tournamentKey}/rankings`, { headers })
            .then(async response => {
                const mappedData = response.data.rankings.map(teamInfo => ({
                    type : "team",
                    rankingPoints : teamInfo.extra_stats[0],
                    number: parseInt(teamInfo.team_key.substring(3), 10),
                    rank: teamInfo.rank,

                }));
                    const findTeamIndex = mappedData.findIndex(team => team.number === params.data.team);
                 
                  if(findTeamIndex)
                  {
                    if(findTeamIndex < params.data.topTeamCount + params.data.teamsAboveCount)
                    {
                        data.rankingBlocks = mappedData
                    }
                    else
                    {
                        let arrRankings = mappedData.slice(0, params.data.topTeamCount)
                        const startingIndex = findTeamIndex - params.data.teamsAboveCount || 0
                        arrRankings.push({"type": "collapsedDivider",
                        "teamCount": (startingIndex +1)- params.data.topTeamCount})
                        arrRankings = arrRankings.concat(mappedData.slice(startingIndex))
                        data.rankingBlocks = arrRankings
                    }
                  }    
                  else
                  {
                    data.rankingBlocks = mappedData

                  }

            })

        const nowPlaying = await prismaClient.teamMatchData.findFirst({
                where:
                {
                    tournamentKey: params.data.tournamentKey,
                    scoutReports:
                    {
                        some: {}
                    }
                },
                //reverse order (get most recent)
                orderBy:
                    [
                        { matchType: "asc" },
                        { matchNumber: "desc" }
                    ]
    
            })
            nowPlaying.matchNumber = nowPlaying.matchNumber + 1
        
        if (nowPlaying) {
            const matchesData: any = {}
            matchesData.nowPlaying= await matchFormat(params.data.tournamentKey, nowPlaying.matchNumber, nowPlaying.matchType)
            matchesData.next = await matchFormat(params.data.tournamentKey, nowPlaying.matchNumber + 1, nowPlaying.matchType)
            //if there are more matches left
            if (matchesData.next !== null) {
                const prevMatchAllRows = await prismaClient.teamMatchData.findMany({
                    where:
                    {
                        tournamentKey: params.data.tournamentKey,
                        matchNumber: nowPlaying.matchNumber,
                        matchType: nowPlaying.matchType
                    }
                })
                const allPrevMatches = await prismaClient.teamMatchData.groupBy({
                   by : ["tournamentKey", "matchNumber", "matchType"],
                   where :
                   {
                        scoutReports : {
                            some : {}
                        }
                   }
                })
                const prevMatchAllKeys = []
                prevMatchAllRows.filter(match => (
                    prevMatchAllKeys.push(match.key)

                ));
                for(const match of allPrevMatches)
                {

                    for(let i = 0; i < 6; i ++)
                    {
                        prevMatchAllKeys.push(match.tournamentKey + "_" + MatchEnumToAbrivation[match.matchType] + match.matchNumber + "_" + i)

                    }
                }
                
                //update
                const nextTeamMatch = await prismaClient.teamMatchData.findFirst({
                    where:
                    {
                        tournamentKey: params.data.tournamentKey,
                        key : {
                            notIn : prevMatchAllKeys
                        },
                        scoutReports:
                        {
                            none: {}
                        },
                        teamNumber: params.data.team,

                    },
                    orderBy:
                        [
                            //normal order
                            { matchType: "desc" },
                            { matchNumber: "asc" }
                        ]
                })
                if (nextTeamMatch) {
                    matchesData.teamNext = await matchFormat(params.data.tournamentKey, nextTeamMatch.matchNumber, nextTeamMatch.matchType)
                }
                data.matches = matchesData
                let teamPrevMatch = await prismaClient.teamMatchData.findFirst({
                    where:
                    {
                        tournamentKey: params.data.tournamentKey,
                        teamNumber: params.data.team,
                        scoutReports:
                        {
                            some: {}
                        }
                    },
                    orderBy:
                        [
                            { matchType: "asc" },
                            { matchNumber: "desc" }
                        ]
                })

                //one elim (next) and one qual (prev)
                if (teamPrevMatch === null) {
                    teamPrevMatch = await prismaClient.teamMatchData.findFirst({
                        where:
                        {
                            tournamentKey: params.data.tournamentKey,
                            matchNumber: 1,
                            matchType: "QUALIFICATION"
                        }
                    })
                }
                if (nextTeamMatch && teamPrevMatch.matchType != nextTeamMatch.matchType) {
                    const maxQualifierRow = await prismaClient.teamMatchData.findFirst({
                        where:
                        {
                            tournamentKey: params.data.tournamentKey,
                            matchType: "QUALIFICATION"
                        },
                        orderBy:
                            [
                                { matchType: "asc" },
                                { matchNumber: "desc" }
                            ]
                    })

                    if (nowPlaying.matchType !== teamPrevMatch.matchType) {
                        data.teamMatchTimeline = { "matchCount": (maxQualifierRow.matchNumber - teamPrevMatch.matchNumber) + nextTeamMatch.matchNumber, "currentMatchCount": (maxQualifierRow.matchNumber - teamPrevMatch.matchNumber) + nowPlaying.matchNumber +1}
                    }
                    else {
                        data.teamMatchTimeline = { "matchCount": (maxQualifierRow.matchNumber - teamPrevMatch.matchNumber) + nextTeamMatch.matchNumber, "currentMatchCount": nowPlaying.matchNumber - teamPrevMatch.matchNumber +1}

                    }
                }
                else
                {
                    data.teamMatchTimeline = { "matchCount": nextTeamMatch.matchNumber - teamPrevMatch.matchNumber, "currentMatchCount": nowPlaying.matchNumber - teamPrevMatch.matchNumber +1}
                }
            }


        }


        res.status(200).send(data)

    }
    catch (error) {
        console.log(error)
        res.status(500).send(error)
    }

};
async function matchFormat(tournamentKey: string, matchNumber: number, matchType: MatchType) {
    try {
        const fullLatestedScouted = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: tournamentKey,
                matchNumber: matchNumber,
                matchType: matchType
            },
            orderBy: {
                key: "asc"
            }
        })
        if (fullLatestedScouted.length < 0) {
            return null
        }
        const blueTeams = [fullLatestedScouted[3].teamNumber, fullLatestedScouted[4].teamNumber, fullLatestedScouted[5].teamNumber]
        const redTeams = [fullLatestedScouted[0].teamNumber, fullLatestedScouted[1].teamNumber, fullLatestedScouted[2].teamNumber]
        const key = tournamentKey + "_" + MatchEnumToAbrivation[matchType] + matchNumber
        //CHANGE
        const user = await prismaClient.user.findUnique({
            where:
            {
                id: process.env.PIT_DISPLAY_KEY
            }
        })
        try {
            const matchPredictions = await matchPredictionLogic(user, redTeams[0], redTeams[1], redTeams[2], blueTeams[0], blueTeams[1], blueTeams[2])
            return {
                "key": key,
                "alliances":
                {
                    "red":
                    {
                        "teams": redTeams,
                        winPrediction: matchPredictions.redWinning,

                    },
                    "blue":
                    {
                        "teams": blueTeams,
                        winPrediction: matchPredictions.blueWinning,

                    }
                }
            }
        }
        catch (error) {
            if (error === "not enough data") {
                return {
                    "key": key,
                    "alliances":
                    {
                        "red":
                        {
                            "teams": redTeams,
                        },
                        "blue":
                        {
                            "teams": blueTeams,
                        }

                    }
                }
            }
            else {
                throw (error)
            }
        }
    }
    catch (error) {
        throw (error)
    }
}