import fetchTournaments from "./fetchTournaments";
import fetchTeams from "./fetchTeams";
import fetchMatches from "./fetchMatches";
import { Handler } from "aws-lambda";
import prismaClient from "../prismaClient";

const year = 2024;

export const fetchTournamentsHandler: Handler = async (event) => {
  if (event.skipIfFilled) {
    console.log("Skipping fetch tournaments if filled");

    if ((await prismaClient.tournament.count()) !== 0) {
      return;
    }
  }

  await fetchTournaments(year);
};

export const fetchTeamsHandler: Handler = async (event) => {
  if (event.skipIfFilled) {
    console.log("Skipping fetch teams if filled");

    if ((await prismaClient.team.count()) !== 0) {
      return;
    }
  }

  await fetchTeams();
};

export const fetchMatchesHandler: Handler = async (event) => {
  if (event.skipIfFilled) {
    console.log("Skipping fetch matches if filled");

    if ((await prismaClient.teamMatchData.count()) !== 0) {
      return;
    }
  }

  await fetchMatches();
};
