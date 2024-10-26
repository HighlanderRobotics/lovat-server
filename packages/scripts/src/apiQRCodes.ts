import { z } from "zod";
import { toString } from "qrcode";
import chalk from "chalk";

async function main() {
  const apiURL = new URL(z.string().url().parse(process.env.API_URL));
  apiURL.pathname = "/";
  const urlString = apiURL.href.substring(0, apiURL.href.length - 1);

  const stage = z.string().parse(process.env.STAGE);

  const collectionCode = await toString(
    "com.frc8033.lovatcollection://set-api-url?" +
      new URLSearchParams({ url: urlString, stage }),
    {
      type: "terminal",
      small: true,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }
  );

  const dashboardCode = await toString(
    "com.frc8033.lovatdashboard:///set-api-url?" +
      new URLSearchParams({ url: urlString, stage }),
    {
      type: "terminal",
      small: true,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }
  );

  console.log("Collection");
  console.log(collectionCode);
  console.log("Dashboard");
  console.log(dashboardCode);

  console.log(
    `\nScroll up to see the QR codes. Scan using the camera app to connect one of your Lovat apps to the ${chalk.blueBright.bold(
      stage
    )} stage.\nMake sure you get some sort of confirmation from the app that it worked because it only works on new versions.`
  );

  // Prevent exit
  process.stdin.resume();
  process.stdin.on("data", () => {
    process.exit(0);
  });
}

main();
