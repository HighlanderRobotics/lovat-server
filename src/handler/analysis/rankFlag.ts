import axios from "axios";

import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const rankFlag = async (req: AuthenticatedRequest, teamKey: string, eventKey: string) => {
    const url = 'https://www.thebluealliance.com/api/v3';

    if (eventKey === undefined) {
        return 0;
    }

    try {
        const response = await axios.get(`${url}/event/${eventKey}/rankings`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        });

        const rankings = response.data.rankings;
        for (let i = 0; i < rankings.length; i++) {
            if (rankings[i].team_key === teamKey) {
                return rankings[i].rank;
            }
        }

        return 0;
    } catch (err) {
        // console.error("Error fetching rankings:", err);
        return 0; 
    }
};
