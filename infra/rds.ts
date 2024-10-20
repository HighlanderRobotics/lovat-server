import { tbaKey } from "./secrets";
import { vpc } from "./vpc";

export const rds = new sst.aws.Postgres("LovatDB", { vpc, proxy: true });

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
  const migrationInvocation = new aws.lambda.Invocation(
    "DeploymentMigrateInvocation",
    {
      functionName: migrationFunction.name,
      input: JSON.stringify({
        now: new Date().toISOString(),
      }),
    }
  );

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
      dependsOn: [migrationInvocation],
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
      dependsOn: [migrationInvocation],
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
      dependsOn: [migrationInvocation],
    }
  );

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
      dependsOn: [migrationInvocation],
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
      dependsOn: [migrationInvocation],
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
      dependsOn: [migrationInvocation],
    }
  );
}

// MARK: Dev commands
new sst.x.DevCommand("DrizzleStudio", {
  dev: {
    command: "npx drizzle-kit studio",
    directory: "packages/api",
    autostart: true,
  },
  link: [rds],
});

new sst.x.DevCommand("PrismaStudio", {
  dev: {
    command: "npx prisma studio --browser none",
    directory: "packages/api",
    autostart: true,
  },
  environment: {
    DATABASE_URL: $interpolate`postgresql://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`,
  },
  link: [rds],
});
