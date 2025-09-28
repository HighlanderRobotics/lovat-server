// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import prismaClient from "../../prismaClient";
import { TeamMatchData, WarningType } from '@prisma/client';

// WebClient instantiates a client that can call API methods
// When using Bolt, youxcan use either `app.client` or the `client` passed to listeners.

// Post a message to a channel your app is in using ID and message text
export async function sendWarningToSlack(warning: WarningType, matchNumber: number, teamNumber: number, tournamentKey: string, reportUuid: string) {
  try {
    const upcomingAlliancePartners = await getUpcomingAlliancePartners(teamNumber, matchNumber, tournamentKey)
    const upcomingAlliances = await getUpcomingAlliances(teamNumber, matchNumber, tournamentKey);

    const channels = await getSlackChannels(upcomingAlliancePartners.map((x) => x[0]));

    const report = await prismaClient.scoutReport.findUnique({where: { uuid: reportUuid }, include: { scouter: true }});

    for (const channel of channels) {
      const client = new WebClient(channel.workspace.authToken);
      const scouterName = (report.scouter.sourceTeamNumber == channel.workspace.owner)? report.scouter.name.trim(): `A Scouter from from team ${report.scouter.sourceTeamNumber}`;

      let result;

      const thread = await prismaClient.slackNotificationThread.findFirst({
        where: {
          teamNumber: teamNumber,
          channelId: channel.channelId,
          channel: {
            subscribedEvent: warning
          }
        }
      });

      // Call the chat.postMessage method using the built-in WebClient
      if (thread == null || thread == undefined) {
        if (warning == WarningType.AUTO_LEAVE) {
          result = await client.chat.postMessage({
           channel: channel.channelId,
           text: `Heads up! *${scouterName}* reported your alliance partner in *Q${upcomingAlliancePartners[upcomingAlliancePartners.map((x) => x[0]).findIndex(num => num === matchNumber)][1]}*, team *${teamNumber}*, didn't leave during auto in *Q${matchNumber}*`
         });
       } else if (warning == WarningType.BREAK) {
         result = await client.chat.postMessage({
           channel: channel.channelId,
           // robotBrokeDesc needs to be filtered because old versions of Collection will send it as null, or it might be undefined
           text: `Heads up! *${scouterName}* reported your alliance partner in *Q${upcomingAlliancePartners[upcomingAlliancePartners.map((x) => x[0]).findIndex(num => num === matchNumber)][1]}*, team *${teamNumber}*, broke in *Q${matchNumber}*.\n${
                  report.robotBrokeDescription && report.robotBrokeDescription.trim() !== ""
                ? `> ${report.robotBrokeDescription}`
                : "> no reason specified"
              }`
         });
       }
         const subscriptionIdent = `${channel.channelId}_${(warning == WarningType.AUTO_LEAVE)?"L":"B"}`;

          await prismaClient.slackNotificationThread.create({
            data: {
              messageId: result.ts,
              channelId: channel.channelId,
              subscriptionId: subscriptionIdent,
              matchNumber: matchNumber,
              teamNumber: teamNumber
          }
          })
      } else {
        // when there have already been problems reported about a team, we just send a message to the thread instead of having multiple messages
         if (warning == WarningType.AUTO_LEAVE) {
          result = await client.chat.postMessage({
           channel: channel.channelId,
           thread_ts: thread.messageId,
           text: `Also reported by *${scouterName}* in *Q${matchNumber}*`
         });
       } else if (warning == WarningType.BREAK) {
         result = await client.chat.postMessage({
           channel: channel.channelId,
           thread_ts: thread.messageId,
           // robotBrokeDesc needs to be filtered because old versions of Collection will send it as null, or it might be undefined
           text: `Also reported by *${scouterName}* in *Q${matchNumber}*:\n${
                report.robotBrokeDescription && report.robotBrokeDescription.trim() !== ""
                  ? `> ${report.robotBrokeDescription}`
                  : "> no reason specified"
          }`
         });
       }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// returns an number[] with all match numbers of upcoming matches with team
async function getUpcomingAlliances(team: number, match: number, tournamentKey: string) {
  return (await prismaClient.teamMatchData.findMany({
    where: {
      tournamentKey: tournamentKey,
      teamNumber: team,
      matchNumber: {
        gt: match
      } 
    }
  })).map<[number, boolean]>((x) => [x.matchNumber,(parseInt(x.key.at(-1)) >= 3)]);
}

export async function getUpcomingAlliancePartners(team: number, match: number, tournamentKey: string) {
  const upcomingAlliances = await getUpcomingAlliances(team, match, tournamentKey)

  const upcomingTeams: TeamMatchData[] = await prismaClient.teamMatchData.findMany({
    where: {
      matchNumber: {
        in: upcomingAlliances.map((x) => x[0])
      },
      tournamentKey: tournamentKey,
      teamNumber: {
        not: team
      }
    }
  }
  );

  const out: number[][] = [];

  for (const data of upcomingTeams) {
    if (upcomingAlliances[upcomingAlliances.findIndex(x => x[0] === data.matchNumber)][1]) {
      if (parseInt(data.key.at(-1)) >= 3) {
        out.push([data.teamNumber, data.matchNumber])
      }
    } else {
        if (parseInt(data.key.at(-1)) < 3) {
          out.push([data.teamNumber, data.matchNumber])
      }
    }
  }

  console.log(out.reduce<number[][]>((unique, team) => {
    if (!unique.map((x) => x[0]).includes(team[0])) {
      unique.push(team);
    }
    return unique;
  }, []))

  return out.reduce<number[][]>((unique, team) => {
    if (!unique.map((x) => x[0]).includes(team[0])) {
      unique.push(team);
    }
    return unique;
  }, []);
}

async function getSlackChannels(upcomingAlliancePartners: number[]) {
  return prismaClient.slackSubscription.findMany({
    where: {
      workspace: {team: { number: {in: upcomingAlliancePartners}}} ,
      subscribedEvent: WarningType.AUTO_LEAVE
    },
    include: {
      workspace: true
    }
  });
}