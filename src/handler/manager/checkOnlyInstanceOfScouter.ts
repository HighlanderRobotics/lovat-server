
import prismaClient from '../../prismaClient'
import z from 'zod'
import e, { Request, Response } from "express";
import { AuthenticatedRequest } from '../../lib/middleware/requireAuth';


export const checkOnlyOneInstanceOfScouter = async (tournamentKey : string, currStart : number, currEnd : number) => {
    try {
        let scouterSet = new Set<number>()
        

    }
    catch (error) {
        console.error(error)
        throw(error)

    }

};
