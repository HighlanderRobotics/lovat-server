import { tbaKey } from "./secrets";
import { vpc } from "./vpc";

export const rds = new sst.aws.Postgres("LovatDB", { vpc });

// MARK: Migrations
const migrationFunction = new sst.aws.Function("DeploymentMigrate", {
  vpc,
  link: [rds],
  handler: "packages/api/src/migrateHandler.handler",
  timeout: "60 seconds",
  environment: {
    HOME: "/tmp",
  },
  copyFiles: [
    {
      from: "node_modules/.prisma/client",
      to: ".prisma/client",
    },
    {
      from: "packages/api/prisma",
    },
  ],
});

if (!$dev) {
  new aws.lambda.Invocation("DeploymentMigrateInvocation", {
    functionName: migrationFunction.name,
    input: JSON.stringify({
      now: new Date().toISOString(),
    }),
  });
}

// MARK: TBA Data
const fetchTournamentsCron = new sst.aws.Cron(
  "FetchTournamentsCron",
  {
    job: {
      vpc,
      handler: "packages/api/src/lib/getTBAData.fetchTournamentsHandler",
      link: [rds, tbaKey],
      timeout: "60 seconds",
      copyFiles: [
        {
          from: "node_modules/.prisma/client",
          to: "packages/.prisma/client",
        },
      ],
    },

    schedule: "rate(10 days)",
  },
  {
    dependsOn: [migrationFunction],
  }
);

const fetchTeamsCron = new sst.aws.Cron(
  "FetchTeamsCron",
  {
    job: {
      vpc,
      handler: "packages/api/src/lib/getTBAData.fetchTeamsHandler",
      link: [rds, tbaKey],
      timeout: "60 seconds",
      copyFiles: [
        {
          from: "node_modules/.prisma/client",
          to: "packages/.prisma/client",
        },
      ],
    },
    schedule: "rate(10 days)",
  },
  {
    dependsOn: [migrationFunction],
  }
);

const fetchMatchesCron = new sst.aws.Cron(
  "FetchMatchesCron",
  {
    job: {
      vpc,
      handler: "packages/api/src/lib/getTBAData.fetchMatchesHandler",
      link: [rds, tbaKey],
      timeout: "60 seconds",
      copyFiles: [
        {
          from: "node_modules/.prisma/client",
          to: "packages/.prisma/client",
        },
      ],
    },
    schedule: "rate(1 hour)",
  },
  {
    dependsOn: [migrationFunction],
  }
);

if (!$dev) {
  new aws.lambda.Invocation(
    "FetchTournamentsInvocation",
    {
      functionName: fetchTournamentsCron.nodes.job.name,
      input: JSON.stringify({
        now: new Date().toISOString(),
        skipIfFilled: true,
      }),
    },
    {
      dependsOn: [migrationFunction],
    }
  );

  new aws.lambda.Invocation(
    "FetchTeamsInvocation",
    {
      functionName: fetchTeamsCron.nodes.job.name,
      input: JSON.stringify({
        now: new Date().toISOString(),
        skipIfFilled: true,
      }),
    },
    {
      dependsOn: [migrationFunction],
    }
  );

  new aws.lambda.Invocation(
    "FetchMatchesInvocation",
    {
      functionName: fetchMatchesCron.nodes.job.name,
      input: JSON.stringify({
        now: new Date().toISOString(),
        skipIfFilled: true,
      }),
    },
    {
      dependsOn: [migrationFunction],
    }
  );
}

// MARK: Dev commands
new sst.x.DevCommand(
  "PrismaStudio",
  {
    dev: {
      command: "cd packages/api && npx prisma studio --browser none",
    },
    environment: {
      DATABASE_URL: $interpolate`postgresql://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`,
    },
  },
  {
    dependsOn: [migrationFunction],
  }
);
