import prismaClient from '../../prismaClient'
import z from 'zod'
import { Request, Response } from "express";
import axios from "axios";


export const addTournamentMatches = async (tournamentKey) => {

    try {

        if(tournamentKey === undefined)
        {
            throw("tournament key is undefined")
        }
       
        var url = 'https://www.thebluealliance.com/api/v3';
        var nonQM = 1;
        const tournamentRow = await prismaClient.tournament.findUnique({
            where:
            {
                key: tournamentKey
            }
        })
        if (tournamentRow === null) {
            throw("tournament not found when trying to insert tournament matches");
        }


        await axios.get(`${url}/event/${tournamentKey}/matches`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        }).then(async (response) => {
            // For each match in the tournament
            response.data.sort((a, b) => b.actual_time - a.actual_time);

            for (var i = 0; i < response.data.length; i++) {
                if (response.data[i].comp_level == 'qm') {
                    //all teams in the match
                    var teams = [...response.data[i].alliances.red.team_keys, ...response.data[i].alliances.blue.team_keys];
                    let matchesString = ``;
                    //make matches with trailing _0, _1, _2 etc
                    for (var k = 0; k < teams.length; k++) {
                        matchesString = matchesString + `('${response.data[i].key}_${k}', '${tournamentKey}', ${response.data[i].match_number}, '${teams[k]}', '${response.data[i].comp_level}'), `;
                        let currMatchKey = `${response.data[i].key}_${k}`;
                        let currTeam = Number(teams[k].substring(3))
                        
                        const params = z.object({
                            matchNumber: z.number(),
                            matchType: z.enum(["QUALIFICATION", "ELIMINATION"]),
                            tournamentKey: z.string(),
                            key: z.string(),
                            teamNumber: z.number()
                        }).safeParse({
                            key: currMatchKey,
                            tournamentKey: tournamentKey,
                            matchNumber: response.data[i].match_number,
                            teamNumber: currTeam,
                            matchType: 'QUALIFICATION'
                        })
                
                        if (!params.success) {
                            throw(params)
                        };

                        //cant use currMatch key bc theres an issue with the enum
                        await prismaClient.teamMatchData.upsert({
                            where : {
                                key : currMatchKey
                            },
                            update : {
                                tournamentKey : params.data.tournamentKey,
                                matchNumber : params.data.matchNumber,
                                teamNumber : params.data.teamNumber,
                                matchType : 'QUALIFICATION'
                            },
                            create: {
                                key : params.data.key,
                                tournamentKey : params.data.tournamentKey,
                                matchNumber : params.data.matchNumber,
                                teamNumber : params.data.teamNumber,
                                matchType : 'QUALIFICATION'
                            }
                        })
                    }
                }
                else {
                    
                    var teams = [...response.data[i].alliances.red.team_keys, ...response.data[i].alliances.blue.team_keys];

                    for (var k = 0; k < 6; k++) {
                        let currTeam = Number(teams[k].substring(3))

                        let currMatchKey = `${tournamentKey}_em${nonQM}_${k}`;
                        
                        const params = z.object({
                            matchNumber: z.number(),
                            matchType: z.enum(["QUALIFICATION", "ELIMINATION"]),
                            tournamentKey: z.string(),
                            key: z.string(),
                            teamNumber: z.number()
                        }).safeParse({
                            key: currMatchKey,
                            tournamentKey: tournamentKey,
                            matchNumber: nonQM,
                            teamNumber: currTeam,
                            matchType: 'ELIMINATION'
                        })
                
                        if (!params.success) {
                            throw(params)
                        };

                       
                        //cant use currMatch key bc theres an issue with the enum
                        await prismaClient.teamMatchData.upsert({
                            where : {
                                key : currMatchKey
                            },
                            update: {
                                tournamentKey : params.data.tournamentKey,
                                matchNumber : params.data.matchNumber,
                                teamNumber : params.data.teamNumber,
                                matchType : 'ELIMINATION'
                            },
                            create: {
                                key : params.data.key,
                                tournamentKey : params.data.tournamentKey,
                                matchNumber : params.data.matchNumber,
                                teamNumber : params.data.teamNumber,
                                matchType : 'ELIMINATION'
                            }
                        })
                    }
                    nonQM += 1;
                }
            }
        });
        return


    }
    catch (error) {
        console.log(error)
        throw("Error adding tournament matches")
    }
}

