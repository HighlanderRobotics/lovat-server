import axios from "axios";

import { User } from "@prisma/client";
import { Resource } from "sst";

export const rankFlag = async (
  user: User,
  teamKey: string,
  eventKey: string
) => {
  const url = "https://www.thebluealliance.com/api/v3";

  if (eventKey === undefined) {
    return 0;
  }

  try {
    const response = await axios.get(`${url}/event/${eventKey}/rankings`, {
      headers: { "X-TBA-Auth-Key": Resource.TBAKey.value },
    });

    const rankings = response.data.rankings;
    for (const currRanking of rankings) {
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
