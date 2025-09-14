import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { WarningType } from "@prisma/client";

export const processCommand = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            command: z.string(),
            text: z.string(),
            channel_id: z.string(),
            team_id: z.string(),
            api_app_id: z.string()
        }).parse(req.body);

        const body = params.text.split(" ");

        console.log("recieved");

        if (body[0] == "subscribe") {
            if (body[1] == "no-leave") {
                await prismaClient.slackSubscription.upsert({
                    where: {
                        channelId: params.channel_id
                    },
                    update: {
                        workspaceId: params.team_id,
                        subscribedEvent: "AUTO_LEAVE"
                    },
                    create: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "AUTO_LEAVE"
                    }
                });
                res.status(200).send("Successfully subscribed to 'no-leave' notifications");
            } else if (body[1] == "break") {
                await prismaClient.slackSubscription.upsert({
                    where: {
                        channelId: params.channel_id
                    },
                    update: {
                        workspaceId: params.team_id,
                        subscribedEvent: "BREAK"
                    },
                    create: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "BREAK"
                    }
                });
                res.status(200).send("Successfully subscribed to 'break' notifications");
            } else {res.status(400).send(`${body[1]} is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`)}

        } else if (body[0] == "unsubscribe") {
            if (body[1] == "no-leave") {
                await prismaClient.slackSubscription.delete({
                    where: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "AUTO_LEAVE"
                    }
                });
                res.status(200).send("Successfully unsubscribed to 'no-leave' notifications");
            } else if (body[1] == "break") {
                await prismaClient.slackSubscription.delete({
                    where: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "BREAK"
                    }
                });
                res.status(200).send("Successfully unsubscribed to 'break' notifications");
            } else {res.status(400).send(`${body[1]} is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`)}
        } else if (body[0] == "team" && body[1] == "set") {
            await prismaClient.slackWorkspace.update({
                where: {
                    workspaceId: params.team_id
                },
                data: {
                    owner: parseInt(body[2])
                }
            })
            res.status(200).send(`Successfully linked workspace to team ${body[2]}`);
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};