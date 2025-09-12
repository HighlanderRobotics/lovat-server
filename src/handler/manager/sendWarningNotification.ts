// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import { SLACK_WARNINGS } from './managerConstants';
import prismaClient from "../../prismaClient";
import { SlackSubscription, TeamMatchData, WarningType } from '@prisma/client';

// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.

// Post a message to a channel your app is in using ID and message text
async function sendWarningToSlack(warning: typeof SLACK_WARNINGS[number], matchNumber: number, teamNumber: number, tournamentKey: string) {
  let channels = await getSlackChannels(teamNumber,matchNumber,tournamentKey);

  for (const channel of channels) {
    const client = new WebClient(channel.workspace.authToken);

    try {
      // Call the chat.postMessage method using the built-in WebClient
      const result = await client.chat.postMessage({
        // The token you used to initialize your app
        token: channel.workspace.authToken,
        channel: channel.channelName,
        text: `Team ${teamNumber} ${warning} in match ${matchNumber}`
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export {sendWarningToSlack};


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
      owner: {
        in: await getUpcomingAlliancePartners(team, match, tournamentKey)
      },
      subscribedEvent: WarningType.AUTO_LEAVE
    },
    include: {
      workspace: true
    }
  });
}