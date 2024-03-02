import axios from "axios";
import prisma from "../prismaClient";

export default async function fetchTeams() {
    // Get teams from TBA and upsert them to the database
    // TBA paginates their API, so we have to loop through all the pages

    const url = "https://www.thebluealliance.com/api/v3";

    const fetchTeamPage = async (page: number) => await axios.get(
        `${url}/teams/${page}/simple`,
        { headers: { "X-TBA-Auth-Key": process.env.TBA_KEY } }
    );

    // Keep going until we get an empty page
    let page = 0;
    let emptyPage = false;

    while (!emptyPage) {
        const response = await fetchTeamPage(page);

        if (response.data.length === 0) {
            emptyPage = true;
        } else {
            for (const team of response.data) {
                await prisma.team.upsert({
                    where: {
                        number: team.team_number,
                    },
                    update: {
                        name: team.nickname,
                    },
                    create: {
                        number: team.team_number,
                        name: team.nickname,
                    },
                });
            }
        }

        page++;
    }

}
