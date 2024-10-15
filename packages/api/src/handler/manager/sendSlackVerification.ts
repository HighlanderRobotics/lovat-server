import dotenv from "dotenv";
import { Resource } from "sst";
dotenv.config();

export const sendSlackVerification = async (
  teamNumber: number,
  teamEmail: string,
  website: string
) => {
  const body = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Received a new team wanting to register",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Number*\n${teamNumber}\n\n*Website*\n${
            website || "_None_"
          }\n\n*Team Email*\n${teamEmail}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Approve",
              emoji: true,
            },
            value: `approve_${teamNumber}`,
            action_id: "verify_action",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Reject",
              emoji: true,
            },
            value: `reject_${teamNumber}`,
            action_id: "reject_action",
          },
        ],
      },
    ],
  };
  if (Resource.SlackWebhook.value === undefined) {
    throw "Slack webhook doesn't exist";
  } else {
    const response = await fetch(Resource.SlackWebhook.value, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw response;
    } else {
      return;
    }
  }
};
//# sourceMappingURL=sendSlackVerification.js.map
