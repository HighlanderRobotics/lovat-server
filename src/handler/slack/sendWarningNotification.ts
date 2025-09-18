// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import prismaClient from "../../prismaClient";
import { ScoutReport, SlackSubscription, TeamMatchData, WarningType } from '@prisma/client';

// WebClient instantiates a client that can call API methods
// When using Bolt, youxcan use either `app.client` or the `client` passed to listeners.

// Post a message to a channel your app is in using ID and message text
export async function sendWarningToSlack(warning: WarningType, matchNumber: number, teamNumber: number, tournamentKey: string, reportUuid: string) {
  try {
    const upcomingAlliancePartners = await getUpcomingAlliancePartners(teamNumber, matchNumber, tournamentKey)
    const upcomingAlliances = await getUpcomingAlliances(teamNumber, matchNumber, tournamentKey);

    let channels = await getSlackChannels(upcomingAlliancePartners);

    let report = await prismaClient.scoutReport.findUnique({where: { uuid: reportUuid }, include: { scouter: true }});

    for (const channel of channels) {
      const client = new WebClient(channel.workspace.authToken);
      const scouterName = (report.scouter.sourceTeamNumber == channel.workspace.owner)? report.scouter.name: "A Scouter";

      // Call the chat.postMessage method using the built-in WebClient
      if (warning == WarningType.AUTO_LEAVE) {
        await client.chat.postMessage({
          channel: channel.channelId,
          text: `Heads up! ${scouterName} from team ${report.scouter.sourceTeamNumber} reported your alliance partner in match Q${getMatchWithTeam(channel.workspace.owner, tournamentKey, upcomingAlliances.map((x) => x[0]))}, Team ${teamNumber} didn't leave during auto in match Q${matchNumber}`
        });
      } else if (warning == WarningType.BREAK) {
        await client.chat.postMessage({
          channel: channel.channelId,
          // robotBrokeDesc needs to be filtered because old versions of Collection will send it as null, or it might be undefined
          text: `Heads up! ${scouterName} from team ${report.scouter.sourceTeamNumber} reported your alliance partner in match Q${getMatchWithTeam(channel.workspace.owner, tournamentKey, upcomingAlliances.map((x) => x[0]))}, Team ${teamNumber} was broken (${(report.robotBrokeDescription != null || undefined)?"no reason specified":report.robotBrokeDescription}) in match Q${matchNumber}`
        });
      }


    }
  } catch (error) {
    console.error(error);
  }
}


async function getMatchWithTeam(team: number, tournamentKey: string, upcomingMatches: number[]) {
  return (await prismaClient.teamMatchData.findFirst({
    where: {
      matchNumber: {
        in: upcomingMatches
      },
      tournamentKey: tournamentKey,
      teamNumber: team
    }
  })).matchNumber
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

async function getUpcomingAlliancePartners(team: number, match: number, tournamentKey: string) {
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