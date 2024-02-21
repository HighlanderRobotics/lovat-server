
import prismaClient from '../../prismaClient'
import z from 'zod'
import e, { Request, Response } from "express";
import { AuthenticatedRequest } from '../../lib/middleware/requireAuth';


export const checkScouterShiftMatches = async (tournamentKey : string, currStart : number, currEnd : number) => {
    try {
        const shifts = await prismaClient.scouterScheduleShift.findMany({
            where :
            {
                tournamentKey : tournamentKey
            },
            orderBy :
            {
                startMatchOrdinalNumber : "asc"
            }
        })
        if(shifts.length === 0)
        {
            return true
        }
        for(let i = 0; i < shifts.length; i ++)
        {
            let currShift = shifts[i]
            if(i == 0 && currStart < currShift.startMatchOrdinalNumber && currEnd < currShift.startMatchOrdinalNumber)
            {
                return true
            }
            else if(currStart > currShift.endMatchOrdinalNumber && i === shifts.length -1)
            {
                return true
            }
            else if(currStart > currShift.endMatchOrdinalNumber && currEnd < shifts[i+1].startMatchOrdinalNumber)
            {
                return true
            }
        }
        return false


    }
    catch (error) {
        console.error(error)
        throw(error)

    }

};
