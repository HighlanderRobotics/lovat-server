
import prismaClient from '../../prismaClient'
import z, { array } from 'zod'
import e, { Request, Response } from "express";
import { AuthenticatedRequest } from '../../lib/middleware/requireAuth';


export const checkOnlyOneInstanceOfScouter = async (teamOne: Array<string>, teamTwo: Array<string>, teamThree: Array<string>, teamFour: Array<string>, teamFive: Array<string>, teamSix: Array<string>) => {
    try {
        const scouterSet = new Set<string>()
        const teamOneData = await checkTeam(teamOne, scouterSet)
        const teamTwoData = await checkTeam(teamTwo, scouterSet)
        const teamThreeData = await checkTeam(teamThree, scouterSet)
        const teamFourData = await checkTeam(teamFour, scouterSet)
        const teamFiveData = await checkTeam(teamFive, scouterSet)
        const teamSixData = await checkTeam(teamSix, scouterSet)
        return teamOneData && teamTwoData && teamThreeData && teamFourData && teamFiveData && teamSixData

    }

    catch (error) {
        console.error(error)
        throw(error)

    }

};
async function checkTeam(arrayOfScouters: Array<string>, scouterSet: Set<string>){
    for(const scouter of arrayOfScouters)
    {
        if(scouterSet.has(scouter))
        {
            return false
        }
        else
        {
            scouterSet.add(scouter)
        }
    }
    return true

}