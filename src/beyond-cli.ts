// @ts-nocheck
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { program } from "commander";
import dayjs from "dayjs";

import { verifyAssets } from "./helpers/verification";
import { uploadNftStorage } from "./helpers/upload";
program.version("0.0.2");

// Verifies that images and json have same number of assets
// Verifies the structure of json
programCommand("verify_assets")
  .requiredOption(
    "-d, --directory <string>",
    "Path of the folder containing assets"
  )
  .requiredOption("-n, --number <number>", "Number of assets")
  .action(async (options, cmd) => {
    console.log("\n === Verifying assets ===");
    const baseDir = options.directory;
    const numberOfAssets = options.number;
    const imageDir = path.join(baseDir, "images");
    const jsonDir = path.join(baseDir, "jsons");
    const imageList = fs.readdirSync(imageDir);
    const jsonList = fs.readdirSync(jsonDir);
    verifyAssets(imageList, jsonList, numberOfAssets, baseDir);
    console.log("\n === Verifying successful ===");
    process.exit(0);
  });

// Uploads the images and jsons as a flat file structure
programCommand("upload_assets")
  .requiredOption(
    "-d, --directory <string>",
    "Path of the folder containing assets"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options: string, cmd: any) => {
    console.log("\n === Uploading assets ===");
    const baseDir = options.directory;
    let config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    const { nftStorageApiKey } = config;
    config.ipfsLink = await uploadNftStorage(nftStorageApiKey, baseDir);
    fs.writeFileSync(options.config, JSON.stringify(config, null, 2));
    console.log("\n === Finished upload & saved IPFS CID ===\n");
    process.exit(0);
  });

// Deploys the contract and initializes it from the values present in config file
programCommand("deploy_contract")
  .option(
    "-e, --env <string>",
    "NEAR cluster env name. One of: mainnet, testnet",
    "testnet"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options) => {
    const { env } = options;
    const config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    // TODO: Put more thorugh validation of the config
    // Ensure the upload is done
    if (!config.ipfsLink) {
      console.log(
        "Assets are not uploaded, please upload the assets first before deploying."
      );
    }

    const premintStartEpoch = dayjs(config.premintStartDate).unix();
    const publicMintStartEpoch = dayjs(config.publicMintStartDate).unix();
    const initDict = {
      owner_id: config.walletAuthority,
      name: config.collectionName,
      symbol: config.symbol,
      uri: `https://${config.ipfsLink}.ipfs.dweb.link/`,
      description: config.description,
      size: config.size,
      base_cost: config.costInNear.toString() + "000000000000000000000000",
      min_cost: config.costInNear.toString() + "000000000000000000000000",
      premint_start_epoch: premintStartEpoch,
      mint_start_epoch: publicMintStartEpoch,
      royalties: {
        accounts: config.royaltiesPayout,
        percent: config.royaltiesPercent,
      },
      initial_royalties: {
        accounts: config.initialsPayout,
        percent: 100,
      },
    };

    // Deploy the contract
    // TODO: Put a check if a contract is already deploy on this near address
    const deployCommand = `NEAR_ENV=${env} near deploy ${
      config.walletAuthority
    } ./programs/dragon.wasm new_default_meta '${JSON.stringify(
      initDict
    )}' --accountId ${config.walletAuthority}`;
    console.log({ deployCommand });
    const deployOutput = execSync(deployCommand, { encoding: "utf-8" });
    console.log({ deployOutput });

    process.exit(0);
  });

// Whitelists the addresses
programCommand("whitelist")
  .option(
    "-e, --env <string>",
    "NEAR cluster env name. One of: mainnet, testnet",
    "testnet"
  )
  .requiredOption(
    "-wj, --wl-json <string>",
    "Path of the json file containing addresses with allocation"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options) => {
    const { env } = options;
    const config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    const wlJson = JSON.parse(fs.readFileSync(options.wlJson, "utf8"));
    // TODO: Make these calls concurrent
    // TODO: Reformat the output shown to the user
    for (const nearAddress in wlJson) {
      // Whitelist

      const whiltelistCommand = `NEAR_ENV=${env} near call ${
        config.walletAuthority
      } add_whitelist_account '${JSON.stringify({
        account_id: nearAddress,
        allowance: wlJson[nearAddress],
      })}' --accountId ${config.walletAuthority}`;
      console.log({ whiltelistCommand });
      const whiltelistOutput = execSync(whiltelistCommand, {
        encoding: "utf-8",
      });
      console.log({ whiltelistOutput });

      // Verify Whitelist

      const verifyWhiltelistCommand = `NEAR_ENV=${env} near view ${
        config.walletAuthority
      } get_wl_allowance '${JSON.stringify({
        account_id: nearAddress,
      })}' --accountId ${config.walletAuthority}`;
      console.log({ verifyWhiltelistCommand });
      const verifyWhiltelistOutput = execSync(verifyWhiltelistCommand, {
        encoding: "utf-8",
      });
      console.log({ verifyWhiltelistOutput });
    }
    process.exit(0);
  });

function programCommand(name: string) {
  return program.command(name);
}

program.parse(process.argv);
