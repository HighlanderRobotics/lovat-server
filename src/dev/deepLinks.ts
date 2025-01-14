import { AppName } from "./appNames";

export default function getDeepLink(url: string, app: AppName): string {
  if (app === "collection") {
    return (
      "com.frc8033.lovatcollection://set-url?" + new URLSearchParams({ u: url })
    );
  }

  if (app === "dashboard") {
    return "com.frc8033.lovatdashboard://set-url/" + encodeURIComponent(url);
  }
}
