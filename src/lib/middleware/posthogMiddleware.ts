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

  res.once("finish", async () => {
    const t1 = performance.now();

    const user = "user" in req && req.user;

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
        const teamCode = z
          .string()
          .optional()
          .parse(req.headers["x-team-code"]);

        if (teamCode) {
          const team = await prisma.registeredTeam.findUnique({
            where: {
              code: teamCode,
            },
          });

          userProps = {
            teamCode: team && teamCode,
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
          $pathname: req.route?.path,
          method: req.method,
          cache: res.getHeader("X-Lovat-Cache"),
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
