import crypto from "crypto";
import { Request as ExpressRequest, Response, NextFunction } from "express";

export const requireSlackSignature = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signature = req.headers["x-slack-signature"] as string;
    const timestamp = req.headers["x-slack-request-timestamp"] as string;

    if (req.body.api_app_id !== process.env.SLACK_APP_ID) {
      res.send(401).send("Unauthorized")
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

    const body = JSON.stringify(req.body) === "{}" ? "" : JSON.stringify(req.body);

    if (!body) {
      res.status(400).send("Bad request");
      return;
    }

    const expectedSignature = `v0=${crypto
      .createHmac("sha256", process.env.SLACK_SIGNING_SECRET)
      .update(`v0:${timestamp}:${body}`, "utf8")
      .digest("hex")}`;

    if (expectedSignature !== signature) {
      res.status(401).send("Unauthorized");
      return;
    }

    next();
  } catch (error) {
    res.status(500).send("Internal server error verifying request");
  }
};
