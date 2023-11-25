import prismaClient from '../../prismaClient'
import z from 'zod'
import { Request, Response } from "express";
import axios from "axios";
import { unwatchFile } from 'fs';


export const addTournamentMatches = async (req: Request, res: Response) => {

    try {

        const tournamentKey = req.body.tournament
        if(tournamentKey === undefined)
        {
            res.status(400).send("invalid tournament key")
            return
        }
        const MatchSchema = z.object({
            matchNumber: z.number(),
            matchType: z.enum(["QUALIFICATION", "ELIMINATION"]),
            tournamentKey: z.string(),
            key: z.string(),
            teamNumber: z.number()
        })
        var url = 'https://www.thebluealliance.com/api/v3';
        var nonQM = 1;
        const tournamentRow = await prismaClient.tournament.findUnique({
            where:
            {
                key: tournamentKey
            }
        })
        if (tournamentRow === null) {
            res.status(400).send("tournament not found when trying to insert tournament matches");
            return;
        }


        await axios.get(`${url}/event/${tournamentKey}/matches`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        }).then(async (response) => {
            // For each match in the tournament
            for (var i = 0; i < response.data.length; i++) {
                // console.log(response.data[i])
                // console.log("-----------------------------")
                if (response.data[i].comp_level == 'qm') {
                    //all teams in the match
                    var teams = [...response.data[i].alliances.red.team_keys, ...response.data[i].alliances.blue.team_keys];
                    console.log(response.data[i].alliances.red)
                    let matchesString = ``;
                    //make matches with trailing _0, _1, _2 etc
                    for (var k = 0; k < teams.length; k++) {
                        matchesString = matchesString + `('${response.data[i].key}_${k}', '${tournamentKey}', ${response.data[i].match_number}, '${teams[k]}', '${response.data[i].comp_level}'), `;
                        let currMatchKey = `${response.data[i].key}_${k}`;
                        let currTeam = Number(teams[k].substring(3))
                        let currMatch = {
                            key: currMatchKey,
                            tournamentKey: tournamentKey,
                            matchNumber: response.data[i].match_number,
                            teamNumber: currTeam,
                            matchType: 'QUALIFICATION'
                        }
                        const possibleTypeErrorMutablePicklist = MatchSchema.safeParse(currMatch)
                        if (!possibleTypeErrorMutablePicklist.success) {
                            res.status(400).send(possibleTypeErrorMutablePicklist)
                            return
                        }

                        //cant use currMatch key bc theres an issue with the enum
                        const currMatchRow = await prismaClient.teamMatchData.upsert({
                            where : {
                                key : currMatchKey
                            },
                            update : {
                                tournamentKey : tournamentKey,
                                matchNumber : response.data[i].match_number,
                                teamNumber : currTeam,
                                matchType : 'QUALIFICATION'
                            },
                            create: {
                                key : currMatchKey,
                                tournamentKey : tournamentKey,
                                matchNumber : response.data[i].match_number,
                                teamNumber : currTeam,
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
                        let currMatch = {
                            key: currMatchKey,
                            tournamentKey: tournamentKey,
                            matchNumber: nonQM,
                            teamNumber: currTeam,
                            matchType: "ELIMINATION"
                        }
                        const possibleTypeErrorMutablePicklist = MatchSchema.safeParse(currMatch)
                        if (!possibleTypeErrorMutablePicklist.success) {
                            res.status(400).send(possibleTypeErrorMutablePicklist)
                            return
                        }
                        //cant use currMatch key bc theres an issue with the enum
                        const currMatchRow = await prismaClient.teamMatchData.upsert({
                            where : {
                                key : currMatchKey
                            },
                            update: {
                                tournamentKey : tournamentKey,
                                matchNumber : nonQM,
                                teamNumber : teams[k],
                                matchType : 'ELIMINATION'
                            },
                            create: {
                                key : currMatchKey,
                                tournamentKey : tournamentKey,
                                matchNumber : nonQM,
                                teamNumber : teams[k],
                                matchType : 'ELIMINATION'
                            }
                        })
                    }
                    nonQM += 1;
                }
            }
        });


    }
    catch (error) {
        console.log(error)
        res.status(400).send('Error adding tournament matches')
    }
}

