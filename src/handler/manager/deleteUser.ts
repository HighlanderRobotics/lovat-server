import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const checkScoutingLead = await prismaClient.user.findMany({
            where:
            {
                teamNumber: req.user.teamNumber,
                role: "SCOUTING_LEAD"
            }
        })

        if (req.user.role === "SCOUTING_LEAD" && checkScoutingLead.length === 1) {
            res.status(400).send("Cannot delete the only scouting lead for the given team")
            return
        }
        else {
            const deletedUser = await prismaClient.user.delete({
                where:
                {
                    id: req.user.id
                }
            })
            res.status(200).send("User sucsesfully deleted")
            // let requestOptions: RequestInit = {
            //     method: 'DELETE',
            //     redirect: 'follow',
            //     headers: {
            //         'Authorization': req.headers.authorization,
            //         'Content-Type': 'application/json'
            //     },
            // }; 
            // const axios = require('axios');

            // let config = {
            //   method: 'delete',
            //   maxBodyLength: Infinity,
            //   url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/:id`,
            //   headers: { }
            // };
            
            // axios.request(config)
            // .then((response) => {
            //     console.log(response)
            //   res.status(200).send("Sucsessfullly deleted the user")
            // })
            // .catch((error) => {
            //     res.status(400).send(error)
            // });
            
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);

    }
};
