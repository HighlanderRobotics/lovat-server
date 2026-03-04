import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./requireAuth.js";
import { posthog } from "../../posthogClient.js";
import prisma from "../../prismaClient.js";
import z from "zod";

const posthogReporter = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t0 = performance.now();
  const getHeaderValue = (headerName: string) => {
    const value = req.headers[headerName];

    return Array.isArray(value) ? value[0] : value;
  };

  res.once("finish", async () => {
    const t1 = performance.now();

    const user = "user" in req && req.user;
    const teamCode = getHeaderValue("x-team-code");
    const appVersion = getHeaderValue("x-app-version");
    const osName = getHeaderValue("x-os-name");
    const scouterUuid = getHeaderValue("x-scouter-uuid");
    const deviceId = getHeaderValue("x-device-id");
    const appBuild = getHeaderValue("x-build-number");

    let userProps;

    if (user) {
      userProps = {
        name: user.username,
        email: user.email,
        role: user.role,
        userType: "user", // as opposed to scouter
        teamNumber: user.teamNumber,
        $ip: req.ips[0] || req.ip,
      };
    } else {
      try {
        const parsedTeamCode = z.string().optional().parse(teamCode);
        const parsedScouterUuid = z.string().optional().parse(scouterUuid);

        if (parsedScouterUuid) {
          const scouter = await prisma.scouter.findUnique({
            where: {
              uuid: parsedScouterUuid,
            },
          });

          if (scouter) {
            userProps = {
              uuid: scouter.uuid,
              name: scouter.name,
              userType: "scouter",
              teamNumber: scouter.sourceTeamNumber,
              teamCode: parsedTeamCode,
            };
          }
        }

        if (!userProps && parsedTeamCode) {
          const team = await prisma.registeredTeam.findUnique({
            where: {
              code: parsedTeamCode,
            },
          });

          userProps = {
            teamCode: parsedTeamCode,
            userType: "scouter",
            teamNumber: team?.number,
          };
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (userProps?.userType === "user") {
      posthog.capture({
        distinctId: user.id,
        event: "response",
        properties: {
          $ip: req.ips[0] || req.ip,
          $set: userProps,
          $pathname: req.baseUrl + req.route?.path,
          method: req.method,
          cache: res.getHeader("X-Lovat-Cache"),
          $os_name: osName,
          appVersion,
          appBuild,
          path: req.originalUrl,
          query: req.query,
          reqBody: req.body,
          statusCode: res.statusCode,
          railwayDeployment: process.env.RAILWAY_DEPLOYMENT_ID,
          railwayReplica: process.env.RAILWAY_REPLICA_ID,
          gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA,
          responseTime: Math.round(t1 - t0),
        },
        disableGeoip: false,
      });
    }
    if (userProps?.userType === "scouter") {
      const distinctId =
        userProps.uuid ?? deviceId ?? (req.ip ? `scouter:ip:${req.ip}` : "scouter:unknown");

      if (deviceId && userProps.uuid) {
        posthog.alias({
          distinctId: deviceId,
          alias: userProps.uuid,
        });
      }

      posthog.capture({
        distinctId,
        event: "response",
        properties: {
          $ip: req.ips[0] || req.ip,
          $set: userProps,
          $pathname: req.baseUrl + req.route?.path,
          method: req.method,
          cache: res.getHeader("X-Lovat-Cache"),
          $os_name: osName,
          appVersion,
          appBuild,
          path: req.originalUrl,
          query: req.query,
          reqBody: req.body,
          statusCode: res.statusCode,
          railwayDeployment: process.env.RAILWAY_DEPLOYMENT_ID,
          railwayReplica: process.env.RAILWAY_REPLICA_ID,
          gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA,
          responseTime: Math.round(t1 - t0),
        },
        disableGeoip: false,
      });
    }
    if (process.env.NODE_ENV === "development") {
      console.log(
        `${req.method} ${req.originalUrl}: %d ms, HTTP ${res.statusCode}`,
        Math.round(t1 - t0)
      );
    }
  });

  next();
};

export default posthogReporter;
