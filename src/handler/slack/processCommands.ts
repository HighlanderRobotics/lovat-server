import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const processCommand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        command: z.string(),
        text: z.string(),
        channel_id: z.string(),
        team_id: z.string(),
        api_app_id: z.string(),
      })
      .parse(req.body);

    const body = params.text.split(" ");

    const action = body[0] ?? null;

    if (body.length === 0 || action === "help") {
      res
        .status(200)
        .send(
          "Click <https://lovat-learn.highlanderrobotics.com/guides/slack-notifcations|here> for a list of all commands and a setup guide",
        );
      return;
    } else if (action === "subscribe") {
      if (
        (
          await prismaClient.slackWorkspace.findFirstOrThrow({
            where: { workspaceId: params.team_id },
          })
        ).owner === null
      ) {
        res
          .status(200)
          .send(
            `You need to set your team number to use /lovat subscribe. Use /lovat team set [your team code]`,
          );
        return;
      }

      let no_leave = false,
        breakSub = false;

      if (body.length === 1) {
        no_leave = true;
        breakSub = true;
      } else if (body[1] === "no-leave") {
        no_leave = true;
      } else if (body[1] === "break") {
        breakSub = true;
      } else {
        res
          .status(200)
          .send(
            `'${body[1]} 'is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`,
          );
        return;
      }

      const messages: string[] = [];

      if (no_leave) {
        await prismaClient.slackSubscription.upsert({
          where: {
            subscriptionId: `${params.channel_id}_L`,
          },
          update: {
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "AUTO_LEAVE",
          },
          create: {
            subscriptionId: `${params.channel_id}_L`,
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "AUTO_LEAVE",
          },
        });
        messages.push("'no-leave'");
      }

      if (breakSub) {
        await prismaClient.slackSubscription.upsert({
          where: {
            subscriptionId: `${params.channel_id}_B`,
          },
          update: {
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "BREAK",
          },
          create: {
            subscriptionId: `${params.channel_id}_B`,
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "BREAK",
          },
        });
        messages.push("'break'");
      }

      res
        .status(200)
        .send(
          `Successfully subscribed to ${messages.join(" and ")} notifications`,
        );
      return;
    } else if (action === "unsubscribe") {
      if (
        (
          await prismaClient.slackWorkspace.findFirstOrThrow({
            where: { workspaceId: params.team_id },
          })
        ).owner == null
      ) {
        res
          .status(200)
          .send(
            `You need to set your team number to use /lovat unsubscribe. Use /lovat team set [your team code]`,
          );
        return;
      }

      let no_leave = false,
        breakSub = false;

      if (body.length === 1) {
        no_leave = true;
        breakSub = true;
      } else if (body[1] === "no-leave") {
        no_leave = true;
      } else if (body[1] === "break") {
        breakSub = true;
      } else {
        res
          .status(200)
          .send(
            `'${body[1]}' is not a valid argument for '/lovat subscribe'. Acceptable arguments are 'no-leave' and 'break'`,
          );
        return;
      }

      const messages: string[] = [];

      if (no_leave) {
        await prismaClient.slackSubscription.deleteMany({
          where: {
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "AUTO_LEAVE",
          },
        });
        messages.push("'no-leave'");
      }

      if (breakSub) {
        await prismaClient.slackSubscription.deleteMany({
          where: {
            channelId: params.channel_id,
            workspaceId: params.team_id,
            subscribedEvent: "BREAK",
          },
        });
        messages.push("'break'");
      }

      res
        .status(200)
        .send(
          `Successfully unsubscribed from ${messages.join(" and ")} notifications`,
        );
      return;
    } else if (action === "team") {
      if (body.length === 1) {
        res
          .status(200)
          .send(
            `Workspace linked to team ${(await prismaClient.slackWorkspace.findUnique({ where: { workspaceId: params.team_id } })).owner}`,
          );
        return;
      } else if (body[1] === "set") {
        try {
          const teamNumber = (
            await prismaClient.registeredTeam.findUniqueOrThrow({
              where: {
                code: body[2],
              },
            })
          ).number;

          await prismaClient.slackWorkspace.update({
            where: {
              workspaceId: params.team_id,
            },
            data: {
              owner: teamNumber,
            },
          });
          res
            .status(200)
            .send(`Successfully linked workspace to team ${teamNumber}`);
          return;
        } catch {
          res.status(200).send(`Not a valid team code.`);
          return;
        }
      }
    } else {
      res
        .status(400)
        .send(
          `${body[1]} is not a valid argument for '/lovat team'. Try /lovat team set (team code)`,
        );
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
