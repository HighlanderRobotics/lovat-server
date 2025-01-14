import * as os from "node:os";
import { PORT } from "../port";

let url = `http://${os.hostname()}:${PORT}`;

function getUrl(): string {
  return url;
}

function setUrl(newUrl: string): void {
  url = newUrl;
}

export { getUrl, setUrl };
