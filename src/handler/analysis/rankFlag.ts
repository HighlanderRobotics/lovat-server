import axios from "axios";

import { User } from "@prisma/client";

export const rankFlag = async (user: User, teamKey: string, eventKey: string) => {
    const url = 'https://www.thebluealliance.com/api/v3';

    if (eventKey === undefined) {
        return 0;
    }

    try {
        const response = await axios.get(`${url}/event/${eventKey}/rankings`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        });

        const rankings = response.data.rankings;
        for (const currRanking of rankings){
            if (currRanking.team_key === teamKey) {
                return currRanking.rank;
            }
        }
        return 0;
    } catch (err) {
        // console.error("Error fetching rankings:", err);
        return 0; 
    }
};
