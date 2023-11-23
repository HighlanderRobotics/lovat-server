import axios from "axios";
import prisma from "../prismaClient";

export default async function fetchTournaments(initialYear?: number, finalYear?: number) {
    // Get tournaments from TBA and upsert them to the database
    initialYear = initialYear || 2022;
    finalYear = finalYear || new Date().getFullYear();

    const url = "https://www.thebluealliance.com/api/v3";

    for (let year = initialYear; year <= finalYear; year++) {
        await axios.get(`${url}/events/${year}/simple`, {
            headers: { "X-TBA-Auth-Key": process.env.TBA_KEY },
        }).then(async (response) => {
            for (const tournament of response.data) {
                await prisma.tournament.upsert({
                    where: {
                        key: tournament.key,
                    },
                    update: {
                        name: tournament.name,
                        location: tournament.city,
                        date: tournament.start_date,
                    },
                    create: {
                        key: tournament.key,
                        name: tournament.name,
                        location: tournament.city,
                        date: tournament.start_date,
                    },
                });
            }
        });
    }
}
