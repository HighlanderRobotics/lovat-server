// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient } from '@slack/web-api'
import { SLACK_WARNINGS } from './managerConstants';

// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
const client = new WebClient(process.env.SLACK_KEY);

// Post a message to a channel your app is in using ID and message text
async function sendWarningToSlack(warning: typeof SLACK_WARNINGS[number], matchNumber: number, teamNumber: number) {
  try {
    // Call the chat.postMessage method using the built-in WebClient
    const result = await client.chat.postMessage({
      // The token you used to initialize your app
      token: process.env.SLACK_KEY,
      channel: "lovat-notifications",
      text: `Team ${teamNumber} ${warning} in match ${matchNumber}`
      // You could also use a blocks[] array to send richer content
    });

    // Print result, which includes information about the message (like TS)
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}

sendWarningToSlack(SLACK_WARNINGS[0], 1, 8033);

export {sendWarningToSlack};