import "./app.js";
import chalk from "chalk";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const downloadPath = path.join(process.cwd(), "download");

async function main() {
  console.log(
    chalk.yellow("[Build] Checking if the download folder exists...")
  );
  if (!existsSync(downloadPath)) {
    console.log(chalk.green("[Build] Creating the download folder..."));
    mkdirSync(downloadPath);
    mkdirSync(downloadPath + "/video");
    mkdirSync(downloadPath + "/audio");
    console.log(chalk.green("[Build] Download folder created."));
  } else {
    console.log(chalk.green("[Build] Download folder already exists."));
  }
}

main();
