import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'

export const addSlackWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({code: z.string()}).parse(req.query);

        const form = new FormData();

        form.append("code", params.code);
        form.append("client_id", process.env.SLACK_CLIENT_ID);
        form.append("client_secret", process.env.SLACK_CLIENT_SECRET);
        form.append("redirect_uri", process.env.BASE_URL + "/v1/slack/add-workspace");

        const response = await (await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            body: form
        })).json()

        console.log(response);

        const data = z.object({
            access_token: z.string(),
            team: z.object({
                id: z.string(),
                name: z.string()
            }),
            bot_user_id: z.string(),
            authed_user: z.object({
                id: z.string()
            })
        }).parse(response);

        await prismaClient.slackWorkspace.upsert({
            where: {
                workspaceId: data.team.id
            },
            update: {
                name: data.team.name,
                authToken: data.access_token,
                botUserId: data.bot_user_id,
                authUserId: data.authed_user.id
            },
            create: {
                workspaceId: data.team.id,
                name: data.team.name,
                authToken: data.access_token,
                botUserId: data.bot_user_id,
                authUserId: data.authed_user.id
            }
        })

        res.redirect("https://lovat-learn.highlanderrobotics.com/guides/slack-notifcations");
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};