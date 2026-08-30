import "dotenv/config";
import importAllTournaments from "./lib/importAllTournaments.js";

const main = async () => {
  try {
    await importAllTournaments();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main();
