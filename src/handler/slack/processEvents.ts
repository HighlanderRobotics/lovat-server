import { Request, Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";

export const processEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = z
    .object({
      type: z.literal("event_callback"),
      token: z.string(),
      team_id: z.string(),
      api_app_id: z.string(),
      event: z.union([
        z.object({
          type: z.literal("channel_deleted"),
          channel: z.string(),
        }),
        z.object({
          type: z.literal("app_uninstalled"),
        }),
      ]),
      event_id: z.string(),
    })
    .parse(req.body);

  if (params.event.type === "app_uninstalled") {
    await prismaClient.slackWorkspace.deleteMany({
      where: {
        workspaceId: params.team_id,
      },
    });
  } else if (params.event.type === "channel_deleted") {
    await prismaClient.slackSubscription.deleteMany({
      where: {
        channelId: params.event.channel,
      },
    });
  }
};
