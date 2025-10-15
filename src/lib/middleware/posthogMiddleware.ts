import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import { posthog } from "../../posthogClient";
import prisma from "../../prismaClient";
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
        $ip: req.ip,
      };
    } else {
      try {
        const teamCode = z
          .string()
          .optional()
          .parse(req.headers["x-team-code"]);

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
      } catch (error) {
        console.error(error);
      }
    }

    if (userProps.userType === "user") {
      posthog.capture({
        distinctId: user.id,
        event: "response",
        properties: {
          $ip: req.ip,
          $set: userProps,
          $pathname: req.route?.path,
          method: req.method,
          path: req.path,
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
  });

  next();
};

export default posthogReporter;
