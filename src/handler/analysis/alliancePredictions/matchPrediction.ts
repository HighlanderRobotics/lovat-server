import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import ss from 'simple-statistics';
import { alliancePage } from "./alliancePage";



export const matchPrediction = async (req: AuthenticatedRequest, res: Response): Promise<Object> => {
    try {
        const params = z.object({
            red1: z.number(),
            red2: z.number(),
            red3: z.number(),
            blue1: z.number(),
            blue2: z.number(),
            blue3: z.number()

        }).safeParse({
            red1: req.query.red1,
            red2: req.query.red2,
            red3: req.query.red3,
            blue1: req.query.blue1,
            blue2: req.query.blue2,
            blue3: req.query.blue3
        })
        if (!params.success) {
            throw (params)
        };
        var redArr1 = (await arrayAndAverageTeam(req, "totalPoints", params.data.red1)).timeLine.map(item => item.dataPoint);
        var redArr2 = (await arrayAndAverageTeam(req, "totalPoints", params.data.red2)).timeLine.map(item => item.dataPoint)
        var redArr3 = (await arrayAndAverageTeam(req, "totalPoints", params.data.red3)).timeLine.map(item => item.dataPoint)


        if (redArr1.length <= 1 || redArr2.length <= 1 || redArr3.length <= 1) {
            //not enough data
            res.status(200).send("not enough data")
            return
        }
        let red1SDV = ss.standardDeviation(redArr1)
        let red2SDV = ss.standardDeviation(redArr2)
        let red3SDV = ss.standardDeviation(redArr3)

        let redAllianceSDV = Math.sqrt(Math.pow(red1SDV, 2) + Math.pow(red2SDV, 2) + Math.pow(red3SDV, 2))
        let redAllianceMean = await getMean(redArr1) + await getMean(redArr2) + await getMean(redArr3)

        var blueArr1 = (await arrayAndAverageTeam(req, "totalPoints", params.data.blue1)).timeLine.map(item => item.dataPoint);
        var blueArr2 = (await arrayAndAverageTeam(req, "totalPoints", params.data.blue2)).timeLine.map(item => item.dataPoint)
        var blueArr3 = (await arrayAndAverageTeam(req, "totalPoints", params.data.blue3)).timeLine.map(item => item.dataPoint)

        if (blueArr1.length <= 1 || blueArr2.length <= 1 || blueArr3.length <= 1) {
            //not enough data
            res.status(200).send("not enough data")
            return
        }
        let blue1SDV = ss.standardDeviation(blueArr1)
        let blue2SDV = ss.standardDeviation(blueArr2)
        let blue3SDV = ss.standardDeviation(blueArr3)



        let blueAllianceSDV = Math.sqrt(Math.pow(blue1SDV, 2) + Math.pow(blue2SDV, 2) + Math.pow(blue3SDV, 2))
        let blueAllianceMean = await getMean(blueArr1) + await getMean(blueArr2) + await getMean(blueArr3)

        let differentialSDV = Math.sqrt(Math.pow(redAllianceSDV, 2) + Math.pow(blueAllianceSDV, 2))
        let differentialMean = redAllianceMean - blueAllianceMean

        let redLoosing = await getZPercent((0 - differentialMean) / differentialSDV)

        let redWinning = 1 - redLoosing
        let blueWiinning = 1 - redWinning

        //starting at 1 (1 = blue, 0 = red)
        let winningAlliance = 1

        if (Math.max(redWinning, blueWiinning) == redWinning) {
            winningAlliance = 0
        }

        let redAlliance = await alliancePage(req, params.data.red1, params.data.red2, params.data.red3)
        let blueAlliance = await alliancePage(req, params.data.blue1, params.data.blue2, params.data.blue3)


        res.status(200).send({
            red1: params.data.red1,
            red2 : params.data.red2,
            red3: params.data.red3,
            blue1: params.data.blue1,
            blue2: params.data.blue2,
            blue3: params.data.blue3,
            redWinning: redWinning,
            blueWinning: blueWiinning,
            winningAlliance: winningAlliance,
            //dont display auto path stuff
            redAlliance: redAlliance,
            blueAlliance: blueAlliance
        })





    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};
async function getZPercent(z: number) {
    if (z < -6.5)
        return 0.0;
    if (z > 6.5)
        return 1.0;

    var factK = 1;
    var sum = 0;
    var term = 1;
    var k = 0;
    var loopStop = Math.exp(-23);
    while (Math.abs(term) > loopStop) {
        term = .3989422804 * Math.pow(-1, k) * Math.pow(z, k) / (2 * k + 1) / Math.pow(2, k) * Math.pow(z, k + 1) / factK;
        sum += term;
        k++;
        factK *= k;

    }
    sum += 0.5;

    return sum;
}
async function getMean(teamArray: Array<number>) {
    var total = 0;
    for (var i = 0; i < teamArray.length; i++) {
        total += teamArray[i];
    }
    return total / teamArray.length;


}