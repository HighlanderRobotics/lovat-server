import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { WebClient } from "@slack/web-api";

export const addSlackWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({code: z.string()}).parse(req.query);

        const form = new FormData();

        form.append("code", params.code);
        form.append("client_id", process.env.SLACK_CLIENT_ID);
        form.append("client_secret", process.env.SLACK_CLIENT_SECRET);
        form.append("redirect_uri", process.env.BASE_URL + "/v1/slack/add-workspace");

        const response = await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            body: form
        })

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
        }).parse(await response.json());

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

        res.status(200).send("workspace added to db")

        const client = new WebClient(data.access_token);

        await client.chat.postMessage({
            text: "Thanks for adding Lovat! Click [here] (https://lovat-learn.highlanderrobotics.com/guides/slack-notifcations) for a quickstart guide",
            channel: `U${data.authed_user}`
    })
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};