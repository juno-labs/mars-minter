import path from "path";
import fs from "fs";
import { program } from "commander";

program.version("0.0.2");

// Verifies that images and json have same number of assets
// Verifies the structure of json
programCommand("verify_assets")
  .requiredOption(
    "-d, --directory <string>",
    "Path of the folder containing assets"
  )
  .action(async (options, cmd) => {
    const baseDir = options.directory;
    const imageDir = path.join(baseDir, "images");
    const jsonDir = path.join(baseDir, "jsons");
    console.log({ imageDir, jsonDir });
    const imageList = fs.readdirSync(imageDir);
    const jsonList = fs.readdirSync(jsonDir);
    console.log({ imageList, jsonList });
    process.exit(0);
  });

// Uploads the images and jsons as a flat file structure
programCommand("upload_assets")
  .requiredOption(
    "-d, --directory <string>",
    "Path of the folder containing assets"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options, cmd) => {
    const config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    const { nftStorageApiKey } = config;
    console.log({ nftStorageApiKey });
    process.exit(0);
  });

// Deploys the contract and initializes it from the values present in config file
programCommand("deploy_contract")
  .requiredOption(
    "-d, --directory <string>",
    "Path of the folder containing assets"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options, cmd) => {
    const config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    console.log({ config });
    process.exit(0);
  });

// Whitelists the addresses
programCommand("whitelist")
  .requiredOption(
    "-wj, --wl-json <string>",
    "Path of the json file containing addresses with allocation"
  )
  .action(async (options, cmd) => {
    const wlJson = JSON.parse(fs.readFileSync(options.wlJson, "utf8"));
    console.log({ wlJson });
    process.exit(0);
  });

function programCommand(name: string) {
  return program.command(name);
}

program.parse(process.argv);
