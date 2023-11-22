import {z} from 'zod'
export const scouterShiftSchmea = z.object
({
    endMatchOrdinalNumber : z.number(),
    startMatchOrdinalNumber : z.number(),
    team1 : z.array(z.string()),
    team2 : z.array(z.string()),
    team3 : z.array(z.string()),
    team4 : z.array(z.string()),
    team5 : z.array(z.string()),
    team6 : z.array(z.string()),
    tournamentKey : z.string(),
})