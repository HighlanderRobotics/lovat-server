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

        const action = body[0];

        if (body.length == 0 || body[0] == "help") {
            res.status(200).send("Visit lovat.app for a list of all commands and a setup guide"); return
        } else if (action == "subscribe") {
            let no_leave = false, breakSub = false;
        
            if (body.length == 1) {
                no_leave = true;
                breakSub = true;
            } else if (body[1] == "no-leave") {
                no_leave = true;
            } else if (body[1] == "break") {
                breakSub = true;
            } else {
                res.status(400).send(`${body[1]} is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`);
                return;
            }
        
            const messages: string[] = [];
        
            if (no_leave) {
                await prismaClient.slackSubscription.upsert({
                    where: {
                        channelId_subscribedEvent: {
                           channelId: params.channel_id,
                            subscribedEvent: "AUTO_LEAVE"
                        }
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
                messages.push("'no-leave'");
            }
        
            if (breakSub) {
                await prismaClient.slackSubscription.upsert({
                    where: {
                        channelId_subscribedEvent: {
                            channelId: params.channel_id,
                            subscribedEvent: "BREAK"
                        }
                     },
                    update: {
                        workspaceId: params.team_id,
                        
                    },
                    create: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "BREAK"
                    }
                });
                messages.push("'break'");
            }
        
            res.status(200).send(`Successfully subscribed to ${messages.join(" and ")} notifications`);
            return
        } else if (action == "unsubscribe") {
            let no_leave = false, breakSub = false;
        
            if (body.length == 1) {
                no_leave = true;
                breakSub = true;
            } else if (body[1] == "no-leave") {
                no_leave = true;
            } else if (body[1] == "break") {
                breakSub = true;
            } else {
                res.status(400).send(`${body[1]} is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`);
                return;
            }
        
            const messages: string[] = [];
        
            if (no_leave) {
                await prismaClient.slackSubscription.deleteMany({
                    where: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "AUTO_LEAVE"
                    }
                });
                messages.push("'no-leave'");
            }
        
            if (breakSub) {
                await prismaClient.slackSubscription.deleteMany({
                    where: {
                        channelId: params.channel_id,
                        workspaceId: params.team_id,
                        subscribedEvent: "BREAK"
                    }
                });
                messages.push("'break'");
            }
        
            res.status(200).send(`Successfully unsubscribed from ${messages.join(" and ")} notifications`);
            return;
        } else if (action == "team") {
            if (body.length == 1) {
                res.status(200).send(`Workspace linked to team ${(await prismaClient.slackWorkspace.findUnique({where: {workspaceId: params.team_id}})).owner}`); return;
            } else if (body[1] == "set") {
                await prismaClient.slackWorkspace.update({
                    where: {
                        workspaceId: params.team_id
                    },
                    data: {
                        owner: parseInt(body[2])
                    }
                })
                res.status(200).send(`Successfully linked workspace to team ${body[2]}`); return;
            } else {
                res.status(400).send(`${body[1]} is not a valid argument for '/lovat team'. Try /lovat team set`);
            }
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
};