import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import axios from "axios";
import { arrayAndAverageTeam } from "./coreAnalysis/arrayAndAverageTeam";


export const flag = async (req: AuthenticatedRequest, flagName: string, tournamentKey: string = null, teamNumber: number) => {
    try {
        const params = z.object({
            flagName: z.enum(["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "feeds", "drops", "rank"])
        }).safeParse({
            flagName: flagName
        })
        if (!params.success) {
            throw (params)
        };
        if (params.data.flagName === "rank") {
            if (tournamentKey === null) {
                return "-"
            }

            const url = 'https://www.thebluealliance.com/api/v3'
            axios.get(`${url}/event/${tournamentKey}/rankings`, {
                headers: { 'X-TBA-Auth-Key': process.env.KEY }

            })
                .then(async (response) => {
                    for (let i = 0; i < response.data.rankings.length; i++) {

                        if (response.data.rankings[i].team_key === ("frc" + teamNumber)) {
                            const x = response.data.rankings[i].rank
                            return x.toString()
                        }
                    }
                    return "-"
                })
                .catch(err => {
                    return "-"
                })
        }
        else
        {
            const data = (await arrayAndAverageTeam(req.user, flagName, teamNumber)).average
            return data
        }

    }
    catch (error) {
        throw (error)
    }
}

