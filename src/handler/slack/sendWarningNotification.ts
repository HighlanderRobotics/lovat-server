// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import prismaClient from "../../prismaClient";
import { ScoutReport, SlackSubscription, TeamMatchData, WarningType } from '@prisma/client';

// WebClient instantiates a client that can call API methods
// When using Bolt, youxcan use either `app.client` or the `client` passed to listeners.

// Post a message to a channel your app is in using ID and message text
export async function sendWarningToSlack(warning: WarningType, matchNumber: number, teamNumber: number, tournamentKey: string, reportUuid: string) {
  let channels = await getSlackChannels(teamNumber,matchNumber,tournamentKey);

  let report = await prismaClient.scoutReport.findUnique({where: { uuid: reportUuid }, include: { scouter: true }});

  for (const channel of channels) {
    const client = new WebClient(channel.workspace.authToken);

    try {
      // Call the chat.postMessage method using the built-in WebClient
      const result = await client.chat.postMessage({
        // The token you used to initialize your app
        token: channel.workspace.authToken,
        channel: channel.channelId,
        text: `${report.scouter.name} from team ${report.scouter.sourceTeamNumber} reported Team ${teamNumber} ${warning} in match ${matchNumber}`
      });
    } catch (error) {
      console.error(error);
    }
  }
}


// returns an number[] with all match numbers of upcoming matches with team
async function getUpcomingAlliancePartners(team: number, match: number, tournamentKey: string) {
  const upcomingAlliances = (await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: tournamentKey,
        teamNumber: team,
        matchNumber: {
          gt: match
        } 
      }
  })).map<[number, boolean]>((x) => [x.matchNumber,(parseInt(x.key.at(-1)) >= 3)]);

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

  const out: number[] = [];

  for (const data of upcomingTeams) {
    if (upcomingAlliances[upcomingAlliances.findIndex(x => x[0] === data.matchNumber)][1]) {
      if (parseInt(data.key.at(-1)) >= 3) {
        out.push(data.teamNumber)
      }
    } else {
        if (parseInt(data.key.at(-1)) < 3) {
          out.push(data.teamNumber)
      }
    }
  }

  return out.reduce<number[]>((unique, team) => {
    if (!unique.includes(team)) {
      unique.push(team);
    }
    return unique;
  }, []);
}

async function getSlackChannels(team: number, match: number, tournamentKey: string) {
  return prismaClient.slackSubscription.findMany({
    where: {
      workspace: {team: { number: {in: await getUpcomingAlliancePartners(team, match, tournamentKey)}}} ,
      subscribedEvent: WarningType.AUTO_LEAVE
    },
    include: {
      workspace: true
    }
  });
}