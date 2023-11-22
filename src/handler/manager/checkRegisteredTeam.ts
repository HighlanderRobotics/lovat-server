
import prismaClient from '../../prismaClient'
import z from 'zod'


export const checkRegisteredTeam = async (req, res) => {
    try {
        const CheckRegisteredTeamSchema = z.object({
            teamNumber : z.number().gt(-1)
        }) 
        const currRegisteredTeam = {
            number: req.params.team
        }
        const possibleTypeError = CheckRegisteredTeamSchema.safeParse(currRegisteredTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        
        const row = await prismaClient.registeredTeam.findUnique(
            {
                where: currRegisteredTeam
            }

        )
        res.status(200).send(row)


    }
    catch (error) {
        console.error(error)
        res.status(200).send(error);

    }

};
