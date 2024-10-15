import { Handler } from "aws-lambda";
import { execSync } from "child_process";
import { join } from "path";
import { Resource } from "sst";

export const handler: Handler = async () => {
  const databaseUrl = `postgresql://${
    Resource.LovatDB.username
  }:${encodeURIComponent(Resource.LovatDB.password)}@${Resource.LovatDB.host}:${
    Resource.LovatDB.port
  }/${Resource.LovatDB.database}`;

  // Print out all the files in /prisma
  // console.log(
  //   "Files: ",
  //   execSync(`ls -lah ${join(__dirname, "../prisma")}`).toString()
  // );

  execSync(
    `DATABASE_URL=${databaseUrl} npx prisma migrate deploy --schema ${join(
      __dirname,
      "../prisma/schema.prisma"
    )}`
  );
};
