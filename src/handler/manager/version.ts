import { Request, Response } from "express";

const VERSION  = '26.0.0'

export const getVersion = async (req: Request, res: Response) => {

    const gitCommit = process.env.RAILWAY_GIT_COMMIT_SHA ?? "no commit id";

    res.status(200).send({version: VERSION,
        gitCommit
    })
}