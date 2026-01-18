// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from "@slack/web-api";
import prismaClient from "../../prismaClient.js";
import { TeamMatchData, WarningType } from "@prisma/client";

// WebClient instantiates a client that can call API methods
// When using Bolt, youxcan use either `app.client` or the `client` passed to listeners.

// sends a warning to all upcoming alliance partners slack workspaces
export async function sendWarningToSlack(
  warning: WarningType,
  matchNumber: number,
  teamNumber: number,
  tournamentKey: string,
  reportUuid: string,
): Promise<void> {
  try {
    const upcomingAlliancePartners = await getUpcomingAlliancePartners(
      teamNumber,
      matchNumber,
      tournamentKey,
    );

    const channels = await getSlackChannels(
      upcomingAlliancePartners.map((x) => x[0]),
      warning,
    );

    const report = await prismaClient.scoutReport.findUnique({
      where: { uuid: reportUuid },
      include: { scouter: true },
    });

    for (const channel of channels) {
      const client = new WebClient(channel.workspace.authToken);
      const scouterName =
        report.scouter.sourceTeamNumber == channel.workspace.owner
          ? report.scouter.name.trim()
          : `A Scouter from team ${report.scouter.sourceTeamNumber}`;

      // Locate the upcoming match number for the workspace's team; fall back to a generic label if missing.
      const partnerMatch = upcomingAlliancePartners.find(
        ([partnerTeam]) => partnerTeam === channel.workspace.owner,
      );
      const partnerMatchLabel = partnerMatch?.[1]
        ? `Q${partnerMatch[1]}`
        : "an upcoming match";

      let result;

      const thread = await prismaClient.slackNotificationThread.findFirst({
        where: {
          teamNumber: teamNumber,
          channelId: channel.channelId,
          channel: {
            subscribedEvent: warning,
          },
        },
      });

      // Call the chat.postMessage method using the built-in WebClient
      if (thread == null || thread == undefined) {
        if (warning == WarningType.BREAK) {
          result = await client.chat.postMessage({
            channel: channel.channelId,
            // robotBrokeDesc needs to be filtered because old versions of Collection will send it as null, or it might be undefined
            text: `Heads up! *${scouterName}* reported your alliance partner in *${partnerMatchLabel}*, team *${teamNumber}*, broke in *Q${matchNumber}*.\n${
              report.robotBrokeDescription &&
              report.robotBrokeDescription.trim() !== ""
                ? `> ${report.robotBrokeDescription}`
                : "> no reason specified"
            }`,
          });
        }
        const subscriptionIdent = `${channel.channelId}_B
        }`;

        await prismaClient.slackNotificationThread.create({
          data: {
            messageId: result.ts,
            channelId: channel.channelId,
            subscriptionId: subscriptionIdent,
            matchNumber: matchNumber,
            teamNumber: teamNumber,
          },
        });
      } else {
        // when there have already been problems reported about a team, we just send a message to the thread instead of having multiple messages
        if (warning == WarningType.BREAK) {
          result = await client.chat.postMessage({
            channel: channel.channelId,
            thread_ts: thread.messageId,
            // robotBrokeDesc needs to be filtered because old versions of Collection will send it as null, or it might be undefined
            text: `Also reported by *${scouterName}* in *Q${matchNumber}*:\n${
              report.robotBrokeDescription &&
              report.robotBrokeDescription.trim() !== ""
                ? `> ${report.robotBrokeDescription}`
                : "> no reason specified"
            }`,
          });
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// returns an number[][] with all match numbers of upcoming matches with team and if the team is on the red alliance
async function getUpcomingAlliances(
  team: number,
  match: number,
  tournamentKey: string,
) {
  return (
    await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: tournamentKey,
        teamNumber: team,
        matchNumber: {
          gt: match,
        },
      },
    })
  ).map<[number, boolean]>((x) => [x.matchNumber, parseInt(x.key.at(-1)) >= 3]);
}

// returns a number[] of upcoming alliance partners by getting a list of all upcoming matches and alliances (stored as [matchNumber,redAlliance]) and getting teams on those alliances
async function getUpcomingAlliancePartners(
  team: number,
  match: number,
  tournamentKey: string,
) {
  const upcomingAlliances = await getUpcomingAlliances(
    team,
    match,
    tournamentKey,
  );

  const allianceByMatch = new Map<number, boolean>(upcomingAlliances);

  const upcomingTeams: TeamMatchData[] =
    await prismaClient.teamMatchData.findMany({
      where: {
        matchNumber: {
          in: upcomingAlliances.map((x) => x[0]),
        },
        tournamentKey: tournamentKey,
        teamNumber: {
          not: team,
        },
      },
    });

  const out: number[][] = [];

  for (const data of upcomingTeams) {
    const allianceIsRed = allianceByMatch.get(data.matchNumber);
    if (allianceIsRed === undefined) {
      continue; // skip unexpected data without alliance info
    }

    if (allianceIsRed) {
      if (parseInt(data.key.at(-1)) >= 3) {
        out.push([data.teamNumber, data.matchNumber]);
      }
    } else {
      if (parseInt(data.key.at(-1)) < 3) {
        out.push([data.teamNumber, data.matchNumber]);
      }
    }
  }

  return out.reduce<number[][]>((unique, team) => {
    if (!unique.map((x) => x[0]).includes(team[0])) {
      unique.push(team);
    }
    return unique;
  }, []);
}

// finds all slack channels in workspaces owned by teams in upcomingAlliancePartners and that subscribed to warning
async function getSlackChannels(
  upcomingAlliancePartners: number[],
  warning: WarningType,
) {
  return prismaClient.slackSubscription.findMany({
    where: {
      workspace: { team: { number: { in: upcomingAlliancePartners } } },
      subscribedEvent: warning,
    },
    include: { workspace: true },
  });
}
