import { User } from "@prisma/client";
import { RequestHandler } from "express";
import z from "zod";

type AnalysisContext = {
    user: User
    dataSource?: {
        teams: number[],
        tournaments: string[],
    };
}

type AnalysisParams<T extends z.ZodObject, U extends z.ZodObject> = {
        body: T,
        query: U,
}

export type AnalysisHandlerArgs<T extends z.ZodObject, U extends z.ZodObject> = {
    params: AnalysisParams<T, U>,
    createKey: (params: AnalysisParams<T, U>) => string[],
    calculateAnalysis: (params: AnalysisParams<T, U>, ctx: AnalysisContext) => Promise<any>,
    usesDataSource: boolean;
}

const createAnalysisHandler: <T extends z.ZodObject, U extends z.ZodObject>(args: AnalysisHandlerArgs<T,U>) => RequestHandler = (args) => {
    

    return async (req, res) => {
        const params = {
            body: args.params.body.parse(req.body),
            query: args.params.query.parse(req.query),
        };

        // Make the key - including data source if necessary
        const key = args.createKey(params)

        // Check to see if there's already an output in the cache

        // If not, calculate, respond, then store in cache
    }
}
