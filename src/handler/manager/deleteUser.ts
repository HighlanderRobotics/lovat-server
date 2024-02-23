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
    
            // const axios = require('axios');

            // let config = {
            //     method: 'delete',
            //     maxBodyLength: Infinity,
            //     url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(req.user.id)}`,
            //     headers: {
            //         headers: {
            //             'Authentication': req.headers.authorization,
            //             'Content-Type': 'application/json'
            //         },
            //         method: 'DELETE',
            //         redirect: 'follow',
            //     }
            // };

            // try {
            //     const deleted = await axios.request(config);
            //     if(deleted.success)
            //     {
            //         res.status(200).send("Successfully deleted the user from the database and Auth0.");
            //     }
            // } catch (error) {
            //     console.error(error);
            //     res.status(400).send("Failed to delete the user from Auth0.");
            // }

        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);

    }
};
