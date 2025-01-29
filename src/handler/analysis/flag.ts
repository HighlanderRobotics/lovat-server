import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import axios from "axios";
import { arrayAndAverageTeam } from "./coreAnalysis/arrayAndAverageTeam";
import { Metric } from './analysisConstants';


export const flag = async (req: AuthenticatedRequest, flagName: Metric | "rank", tournamentKey: string = null, teamNumber: number) => {
    try {
        if (flagName === "rank") {
            if (tournamentKey === null) {
                return "-"
            }

            const url = 'https://www.thebluealliance.com/api/v3'
            axios.get(`${url}/event/${tournamentKey}/rankings`, {
                headers: { 'X-TBA-Auth-Key': process.env.KEY }

            })
                .then(async (response) => {
                    for(const currRanking of response.data.rankings){
                        if (currRanking.team_key === ("frc" + teamNumber)) {
                            const x = currRanking.rank
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

