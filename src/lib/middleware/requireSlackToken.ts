import { Request as ExpressRequest, Response, NextFunction } from "express";

export const requireSlackToken = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signature = req.headers["x-slack-signature"] as string;
    const timestamp = req.headers["x-slack-request-timestamp"] as string;
    const verificationKey = req.body.token as string;

    if (req.body.challenge !== undefined) {
      res.status(200).send(req.body.challenge); return;
    }

    if (req.body.api_app_id !== process.env.SLACK_APP_ID) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (!signature || !timestamp) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (
      Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) >
      60 * 5
    ) {
      res.status(401).send("Stale request");
      return;
    }

    if (process.env.SLACK_VERIFICATION_KEY !== verificationKey) {
      res.status(401).send("Unauthorized");
      return;
    }

    next();
  } catch (error) {
    res.status(500).send("Internal server error verifying request");
    return;
  }
};
