import { Response } from "express";
import semver from "semver";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import prismaClient from "../../../prismaClient";

export const getNotices = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const appType = req.header("x-team-code") ? "collection" : "dashboard";
    const appVersion = req.header("x-app-version") as string | undefined;

    const allNotices = await prismaClient.notice.findMany();

    const notices = allNotices.filter((notice) => {
      const noticeRange =
        appType === "collection" ? notice.collection : notice.dashboard;

      if (!noticeRange || !semver.validRange(noticeRange)) {
        return false;
      }

      if (!appVersion) {
        return true;
      }

      const coercedAppVersion = semver.coerce(appVersion);
      if (!coercedAppVersion) {
        return false;
      }

      return semver.satisfies(coercedAppVersion, noticeRange);
    });

    res.status(200).json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in getting notices");
  }
};
