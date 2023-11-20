import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import axios from "axios";

export const addAPITournaments = async (req: Request, res: Response): Promise<void> => {
    try {
        var url = 'https://www.thebluealliance.com/api/v3';

       await axios.get(`${url}/events/${req.body.year}/simple`, {
            headers: { 'X-TBA-Auth-Key': process.env.KEY }
        })
            .then(async (response) => {
                for (var i = 0; i < response.data.length; i++) {
                    const rows = await prismaClient.tournament.create({
                        data: {
                            name: response.data[i].name, location: response.data[i].city, date: response.data[i].start_date, key: response.data[i].key 
                        }
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