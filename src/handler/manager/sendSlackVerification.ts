import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from "express";

export const sendSlackVerification = async (res : Response, teamNumber : number, teamEmail : string, website : string) => {
    const body = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Received a new team wanting to register"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Number*\n${teamNumber}\n\n*Website*\n${website || '_None_'}\n\n*Team Email*\n${teamEmail}`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Approve",
                            "emoji": true
                        },
                        "value": `approve_${teamNumber}`,
                        "action_id": "verify_action"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Reject",
                            "emoji": true
                        },
                        "value": `reject_${teamNumber}`,
                        "action_id": "reject_action"
                    }
                ]
            }
        ]
    };
    if (process.env.SLACK_WEBHOOK == undefined) {
        res.status(500).send("We weren't able to get your message through.");
    }
    else {
        const response = await fetch(process.env.SLACK_WEBHOOK, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            res.status(500).send("We weren't able to get your message through.");
        }
        else {
            res.status(200).send('Verification message sent');
        }
    }
};
//# sourceMappingURL=sendSlackVerification.js.map