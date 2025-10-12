import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import { posthog } from "../../posthogClient";

const posthogReporter = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.once("finish", () => {
    const user = "user" in req && req.user;

    posthog.capture({
      distinctId: user.id,
      event: "request",
      properties: {
        $ip: req.ip,
        method: req.method,
        path: req.path,
        query: req.query,
        reqBody: req.body,
        statusCode: req.statusCode,
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
          teamNumber: user.teamNumber,
        },
        disableGeoip: false,
      });
    }
  });

  next();
};

export default posthogReporter;
