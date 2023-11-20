import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import axios from "axios";

export const addAPITeams = async (req: Request, res: Response): Promise<void> => {
    try {
            var url = 'https://www.thebluealliance.com/api/v3';
            for (var j = 0; j < 18; j++) {
                console.log(`Inserting teams ${Math.round((j / 18) * 100)}%`);
                await axios.get(`${url}/teams/${j}/simple`, {
                    headers: { 'X-TBA-Auth-Key': process.env.KEY }
                })
                    .then(async (response) => {
                        for (var i = 0; i < response.data.length; i++) {
                            const rows = await prismaClient.team.create({
                                data: {
                                    "number": response.data[i].team_number,
                                    "name": response.data[i].nickname,
                                }

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