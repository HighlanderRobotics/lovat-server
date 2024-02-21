
import prismaClient from '../../prismaClient'
import z, { array } from 'zod'
import e, { Request, Response } from "express";
import { AuthenticatedRequest } from '../../lib/middleware/requireAuth';


export const checkOnlyOneInstanceOfScouter = async (teamOne: Array<string>, teamTwo: Array<string>, teamThree: Array<string>, teamFour: Array<string>, teamFive: Array<string>, teamSix: Array<string>) => {
    try {
        let scouterSet = new Set<string>()
        let teamOneData = await checkTeam(teamOne, scouterSet)
        let teamTwoData = await checkTeam(teamTwo, scouterSet)
        let teamThreeData = await checkTeam(teamThree, scouterSet)
        let teamFourData = await checkTeam(teamFour, scouterSet)
        let teamFiveData = await checkTeam(teamFive, scouterSet)
        let teamSixData = await checkTeam(teamSix, scouterSet)
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