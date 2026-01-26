import { GoogleGenAI } from "@google/genai";

const getNoteSummary = async (
  teamNumber: number,
  notes: string[],
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const prompt = `
Summarize the following scouting notes for Team ${teamNumber} in 2-4 sharp, to-the-point overview that highlight the team's strengths and weaknesses in recent matches. Do not be verbose and avoid filler words. There should be no mardown in the response, and do not prefix the team's number with "Team".
DO NOT USE ANY WORDS THAT YOU DON'T NEED TO.

Notes:
${notes.join("\n")}
`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  return result.text || "NO_SUMMARY";
};

export default getNoteSummary;
