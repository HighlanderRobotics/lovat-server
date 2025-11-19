import { Request, Response } from "express";
import z from "zod";

export const onboardingRedirect = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z.object({ team_code: z.string() }).parse(req.query);

    res.cookie('user_team_code', params.team_code, {
    maxAge: 3600000, // Cookie expires in 1 hour (in milliseconds)
  });
  res.redirect('https://slack.com/oauth/v2/authorize?client_id=645725051604.9455262680016&scope=channels:join,channels:read,chat:write,commands,chat:write.public&user_scope=');
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
