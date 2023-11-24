// import prismaClient from '../../prismaClient'
// import z from 'zod'
// import { Request, Response } from "express";
// import axios from "axios";


// export const addTournamentMatches = async (req: Request, res: Response) => {

//     try {

//         const tournamentKey = req.body.tournament
//         const MatchSchema = z.object({
//             matchNumber: z.number(),
//             matchType: z.string(),
//             tournamentKey: z.string(),
//             key: z.string(),
//             teamNumber: z.number()
//         })
//         var url = 'https://www.thebluealliance.com/api/v3';
//         var nonQM = 1;
//         const tournamentRow = await prismaClient.tournament.findUnique({
//             where:
//             {
//                 key: tournamentKey
//             }
//         })
//         if (tournamentRow === null) {
//             res.status(400).send("tournament not found when trying to insert tournament matches");
//             return;
//         }


//         await axios.get(`${url}/event/${tournamentKey}/matches`, {
//             headers: { 'X-TBA-Auth-Key': process.env.KEY }
//         }).then(async (response) => {
//             // For each match in the tournament
//             for (var i = 0; i < response.data.length; i++) {
//                 // console.log(response.data[i])
//                 // console.log("-----------------------------")
//                 if (response.data[i].comp_level == 'qm') {
//                     //all teams in the match
//                     var teams = [...response.data[i].alliances.red.team_keys, ...response.data[i].alliances.blue.team_keys];
//                     let matchesString = ``;
//                     //make matches with trailing _0, _1, _2 etc
//                     for (var k = 0; k < teams.length; k++) {
//                         matchesString = matchesString + `('${response.data[i].key}_${k}', '${tournamentKey}', ${response.data[i].match_number}, '${teams[k]}', '${response.data[i].comp_level}'), `;
//                         let currMatchKey = `${response.data[i].key}_${k}`;

//                         let currMatch = {
//                             key: currMatchKey,
//                             tournamentKey: tournamentKey,
//                             matchNumber: response.data[i].match_number,
//                             //verify teams[k] is not giving the teamKey
//                             teamNumber: teams[k],
//                             matchType: response.data[i].comp_level
//                         }
//                         const possibleTypeErrorMutablePicklist = MatchSchema.safeParse(currMatch)
//                         if (!possibleTypeErrorMutablePicklist.success) {
//                             res.status(400).send(possibleTypeErrorMutablePicklist)
//                             return
//                         }
//                         const currMatchRow = await prismaClient.teamMatchData.create({
//                             data: currMatch
//                         })
//                     }
//                 }
//                 else {
//                     var teams = [...response.data[i].alliances.red.team_keys, ...response.data[i].alliances.blue.team_keys];
//                     for (var k = 0; k < 6; k++) {
//                         let currMatchKey = `${tournamentKey}_em${nonQM}_${k}`;
//                         let currMatch = {
//                             key: currMatchKey,
//                             tournamentKey: tournamentKey,
//                             matchNumber: nonQM,
//                             //verify teams[k] is not giving the teamKey
//                             teamNumber: teams[k],
//                             matchType: "em"
//                         }
//                         const possibleTypeErrorMutablePicklist = MatchSchema.safeParse(currMatch)
//                         if (!possibleTypeErrorMutablePicklist.success) {
//                             res.status(400).send(possibleTypeErrorMutablePicklist)
//                             return
//                         }
//                         const currMatchRow = await prismaClient.teamMatchData.create({
//                             data: currMatch
//                         })
//                     }
//                     nonQM += 1;
//                 }
//             }
//         });


//     }
//     catch (error) {
//         console.log(error)
//         res.status(400).send('Error adding tournament matches')
//     }
// }

