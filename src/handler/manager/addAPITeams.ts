import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import axios from "axios";
import z from 'zod'

export const addAPITeams = async (req: Request, res: Response): Promise<void> => {
    try {
            const TeamSchema = z.object({
                number : z.number().min(0),
                name : z.string()
            })
            var url = 'https://www.thebluealliance.com/api/v3';
            for (var j = 0; j < 18; j++) {
                console.log(`Inserting teams ${Math.round((j / 18) * 100)}%`);
                await axios.get(`${url}/teams/${j}/simple`, {
                    headers: { 'X-TBA-Auth-Key': process.env.KEY }
                })
                    .then(async (response) => {
                        for (var i = 0; i < response.data.length; i++) {
                            const currTeam = {
                                "number": response.data[i].team_number,
                                    "name": response.data[i].nickname,
                            }
                            const possibleTypeError = TeamSchema.safeParse(currTeam)
                            if(!possibleTypeError.success)
                            {
                                res.status(400).send(possibleTypeError)
                                return
                            }
                            const row = await prismaClient.team.create({
                                data: currTeam

                            })
                        }

                          
                    })
            
             }
             res.status(200).send("done");

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};