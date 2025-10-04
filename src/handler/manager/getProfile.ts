import { Response } from "express";
import prismaClient from "../../prismaClient";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    //email, user, id,
    const row = await prismaClient.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        team: {
          select: {
            team: {
              select: {
                number: true,
                name: true,
              },
            },
          },
        },
      },
    });
    res.status(200).send(row);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
