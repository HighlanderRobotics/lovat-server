import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { string } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import ss from 'simple-statistics';
import { alliancePage } from "./alliancePage";
import { match } from "assert";
import { matchPredictionLogic } from "./matchPredictionLogic";
import { User } from "@prisma/client";



export const matchPrediction = async (req: AuthenticatedRequest, res: Response): Promise<Object> => {
    try {
        
        const params = z.object({
            red1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
            red2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
            red3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
            blue1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
            blue2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
            blue3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
        }).safeParse({
            red1: req.query.red1,
            red2: req.query.red2,
            red3: req.query.red3,
            blue1: req.query.blue1,
            blue2: req.query.blue2,
            blue3: req.query.blue3
        })
        if (!params.success) {
            res.status(200).send (params)
            return
        };
        const matchPreictionData = await matchPredictionLogic(req.user, params.data.red1, params.data.red2, params.data.red3, params.data.blue1, params.data.blue2, params.data.blue3)
       

        let redAlliance = await alliancePage(req.user, params.data.red1, params.data.red2, params.data.red3)
        let blueAlliance = await alliancePage(req.user, params.data.blue1, params.data.blue2, params.data.blue3)


        res.status(200).send({
            red1: params.data.red1,
            red2 : params.data.red2,
            red3: params.data.red3,
            blue1: params.data.blue1,
            blue2: params.data.blue2,
            blue3: params.data.blue3,
            redWinning: matchPreictionData.redWinning,
            blueWinning: matchPreictionData.blueWinning,
            winningAlliance: matchPreictionData.winningAlliance,
            //dont display auto path stuff
            redAlliance: redAlliance,
            blueAlliance: blueAlliance
        })





    }
    catch (error) {
        console.log(error)
        if(error ===  "not enough data")
        {
            res.status(200).send("not enough data")
            return
        }
        else
        {
            res.status(500).send(error)
        }
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