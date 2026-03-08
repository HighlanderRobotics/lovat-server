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
      const noticeVersion =
        appType === "collection" ? notice.collection : notice.dashboard;

      if (!noticeVersion || !semver.valid(semver.coerce(noticeVersion))) {
        return false;
      }

      if (!appVersion) {
        return true;
      }

      return semver.satisfies(semver.coerce(appVersion), noticeVersion)!;
    });

    res.status(200).json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in getting notices");
  }
};
