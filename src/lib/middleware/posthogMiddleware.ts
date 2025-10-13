import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import { posthog } from "../../posthogClient";

const posthogReporter = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t0 = performance.now();

  res.once("finish", () => {
    const t1 = performance.now();

    const user = "user" in req && req.user;

    posthog.capture({
      distinctId: user.id,
      event: "response",
      properties: {
        $ip: req.ip,
        method: req.method,
        path: req.path,
        query: req.query,
        reqBody: req.body,
        statusCode: res.statusCode,
        railwayDeployment: process.env.RAILWAY_DEPLOYMENT_ID,
        railwayReplica: process.env.RAILWAY_REPLICA_ID,
        gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA,
        responseTime: t1 - t0,
      },
      disableGeoip: false,
    });

    if (user) {
      posthog.identify({
        distinctId: user.id,
        properties: {
          $ip: req.ip,
          name: user.username,
          email: user.email,
          role: user.role,
          userType: "user", // as opposed to scouter
          teamNumber: user.teamNumber,
        },
        disableGeoip: false,
      });
    }
  });

  next();
};

export default posthogReporter;
