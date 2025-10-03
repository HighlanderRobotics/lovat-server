


export const checkOnlyOneInstanceOfScouter = async (teamOne: string[], teamTwo: string[], teamThree: string[], teamFour: string[], teamFive: string[], teamSix: string[]): Promise<boolean> => {
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
async function checkTeam(arrayOfScouters: string[], scouterSet: Set<string>){
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