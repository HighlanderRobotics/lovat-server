import axios from "axios";

export const rankFlag = async (teamKey: string, eventKey: string) => {
    return null;

    const url = 'https://www.thebluealliance.com/api/v3';

    if (!eventKey) {
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
