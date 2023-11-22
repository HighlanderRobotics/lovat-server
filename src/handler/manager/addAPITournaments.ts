import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import axios from "axios";
import z from 'zod'

export const addAPITournaments = async (req: Request, res: Response): Promise<void> => {
    try {
        var url = 'https://www.thebluealliance.com/api/v3';
        const TournamentSchema = z.object({
            location : z.string(),
            name : z.string().nullable(),
            key : z.string(),
            date : z.string().nullable()
        })
       await axios.get(`${url}/events/${req.body.year}/simple`, {
            headers: { 'X-TBA-Auth-Key': process.env.KEY }
        })
            .then(async (response) => {
                for (var i = 0; i < response.data.length; i++) {
                    const currTournament = {
                        name: response.data[i].name, 
                            location: response.data[i].city, 
                            date: response.data[i].start_date, 
                            key: response.data[i].key 
                    } 
                    const possibleTypeError = TournamentSchema.safeParse(currTournament)
                    if(!possibleTypeError.success)
                    {
                        res.status(400).send(possibleTypeError)
                        return
                    }

                    const rows = await prismaClient.tournament.create({
                        data: currTournament
                    })
                }
                console.log(`Inserted Tournaments for ${req.body.year}`);
                res.status(400).send("done inserting API teams");

            })



    }

    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};