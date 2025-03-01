import axios from "axios";

/** Returns list of ranks by team. Invalid ranks are returned as 0 */
export const rankFlag = async (eventKey: string, ...teams: number[]): Promise<Record<number, number>> => {
    try {
        // TBA request
        const response = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        });
        const rankings: { team_key: string, rank: number }[] = response.data.rankings;

        // Find rank of all teams and push data
        const out: Record<number, number> = {};
        for (const team of teams) {
            const i = rankings.findIndex(val => val.team_key === 'frc'+team);
            if (i === -1) {
                out[team] = 0;
            } else {
                out[team] = rankings[i].rank;
            }
        }
    } catch (err) {
        // Failsafe in case of bad event key, TBA issue, etc
        const out: Record<number, number> = {}
        for (const team of teams) {
            out[team] = 0;
        }
        return out;
    }
};
