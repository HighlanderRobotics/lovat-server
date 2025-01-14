import getDeepLink from "./deepLinks";
import { AppName, formattedAppNames } from "./appNames";
import QRCode from "qrcode";
import { getUrl } from "./url";
import { url } from "inspector";

const stringToQRCode = (data: string) =>
  new Promise((resolve, reject) => {
    QRCode.toString(
      data,
      {
        type: "terminal",
        small: true,
      },
      (err, str) => {
        if (err) {
          reject(err);
        } else {
          resolve(str);
        }
      }
    );
  });

async function printQRCode(app: AppName): Promise<void> {
  const qrCode = await stringToQRCode(getDeepLink(getUrl(), app));

  console.log(qrCode + "\n");
  console.log(`Scan to connect ${formattedAppNames[app]} to ${url}`);
  console.log("Only assume that it worked if the app tells you it did.");
}

export async function makeInteractive(): Promise<void> {
  const readline = await import("readline");

  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on("keypress", (_, key) => {
    if (key && key.name == "d") printQRCode("dashboard");
    if (key && key.name == "c") printQRCode("collection");
  });
}
