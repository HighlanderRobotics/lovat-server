import { createHmac } from "crypto";
import { Request, Response, NextFunction } from "express";

const LOVAT_SIGNING_KEY = process.env.LOVAT_SIGNING_KEY;

const requireLovatSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const signature = req.headers["x-signature"] as string | undefined;
  const timestamp = parseInt(req.headers["x-timestamp"] as string | undefined);
  const { method, path } = req;

  const body =
    JSON.stringify(req.body) === "{}" ? "" : JSON.stringify(req.body);

  if (!signature || !timestamp || isNaN(timestamp)) {
    res.status(401).send("Unauthorized");
    return;
  }

  // Check if timestamp is within 5 minutes
  const timestampDate = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - timestampDate.getTime();
  const diffMinutes = Math.floor(diff / 1000 / 60);
  if (diffMinutes > 5) {
    res.status(401).send("Unauthorized");
    return;
  }

  const generatedSignature = createHmac("sha256", LOVAT_SIGNING_KEY)
    .update(JSON.stringify({ path, method, body, timestamp }))
    .digest("hex");

  if (signature === generatedSignature) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

export default requireLovatSignature;
