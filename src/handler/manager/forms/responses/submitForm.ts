import z from "zod";
import { Prisma } from "@prisma/client";
import prismaClient from "../../../../prismaClient";
import { Request, Response } from "express";

const submitFormParamsSchema = z.object({
  team: z.number().optional(),
  scouterUuid: z.string(),
  matchKey: z.string().optional(),
  formUuid: z.string(),
  parts: z.array(
    z.object({
      formPartUuid: z.string(),
      response: z.union([z.string(), z.number(), z.array(z.string())]),
    }),
  ),
});

export const submitForm = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = submitFormParamsSchema.parse({
      formUuid: req.params.formUuid,
      ...req.body,
    });

    if (!params.matchKey && !params.team) {
      res.status(400).json({ error: "Either matchKey or team is required" });
      return;
    }

    const scouter = await prismaClient.scouter.findUnique({
      where: { uuid: params.scouterUuid },
    });

    if (!scouter) {
      res.status(404).json({ error: "Scouter not found" });
      return;
    }

    const formResponseCreateData: Prisma.FormResponseCreateInput =
      params.matchKey
        ? {
            teamMatchData: { connect: { key: params.matchKey } },
            scouter: { connect: { uuid: params.scouterUuid } },
            form: { connect: { uuid: params.formUuid } },
          }
        : {
            team: { connect: { number: params.team } },
            scouter: { connect: { uuid: params.scouterUuid } },
            form: { connect: { uuid: params.formUuid } },
          };

    const [formResponse, formResponseParts] = await prismaClient.$transaction(
      async (tx) => {
        const formResponse = await tx.formResponse.create({
          data: formResponseCreateData,
        });
        const formResponseParts = await tx.formResponsePart.createManyAndReturn(
          {
            data: params.parts.map((part) => ({
              formResponseUuid: formResponse.uuid,
              formPartUuid: part.formPartUuid,
              response: part.response,
            })),
          },
        );
        return [formResponse, formResponseParts];
      },
    );

    res.status(200).json({ formResponse, formResponseParts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error submitting form:", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the form." });
  }
};
