
import prismaClient from '../../prismaClient'


export const checkRegisteredTeam = async (req, res) => {
    try {
        const row = await prismaClient.registeredTeam.findUnique(
            {
                where:
                {
                    number: req.query.teamNumber
                }
            }

        )
        res.status(200).send(row)


    }
    catch (error) {
        console.error(error)
        res.status(200).send(error);

    }

};
