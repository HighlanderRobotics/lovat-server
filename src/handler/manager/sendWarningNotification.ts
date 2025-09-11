// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import { SLACK_WARNINGS } from './managerConstants';
import prismaClient from "../../prismaClient";
import { SlackSubscription, TeamMatchData, WarningType } from '@prisma/client';

// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.

// Post a message to a channel your app is in using ID and message text
async function sendWarningToSlack(warning: typeof SLACK_WARNINGS[number], matchNumber: number, teamNumber: number, tournamentKey: string) {
  let channel = await prismaClient.slackWorkspace.findFirst({
    where: {
      owner: 8033
    }
  });


  const client = new WebClient(channel.oAuthId);

  try {
    const teamsToNotify: number[] = [];

    // Call the chat.postMessage method using the built-in WebClient
    const result = await client.chat.postMessage({
      // The token you used to initialize your app
      token: channel.oAuthId,
      channel: "lovat-notifications",
      text: `Team ${teamNumber} ${warning} in match ${matchNumber}`
      // You could also use a blocks[] array to send richer content
    });

    console.log(await getSlackChannels(teamNumber,matchNumber,tournamentKey));
  }
  catch (error) {
    console.error(error);
  }
}

export {sendWarningToSlack};


// returns an number[] with all match numbers of upcoming matches with 
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
  return await prismaClient.slackWorkspace.findMany({
    where: {
      owner: {
        in: await getUpcomingAlliancePartners(team, match, tournamentKey)
      }
    },
    include: {
      subscriptions: true
    }
  });
}