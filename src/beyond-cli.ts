// @ts-nocheck
import { exec, execSync } from "child_process";
import { program } from "commander";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import util from "util";
import { uploadNftStorage } from "./helpers/upload";
import {
  verifyAssets,
  validateConfigurationFile,
} from "./helpers/verification";

program.version("0.0.2");

const execAsync = util.promisify(exec);

const COST_FACTOR = 1000000000000000000000000;

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
    const isConfigValid = await validateConfigurationFile(config);
    if (!isConfigValid) {
      return;
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
      base_cost: parseInt(
        parseFloat(config.costInNear) * COST_FACTOR
      ).toString(),
      min_cost: parseInt(
        parseFloat(config.costInNear) * COST_FACTOR
      ).toString(),
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
    const deployCommand = `NEAR_ENV=${env} near deploy ${
      config.walletAuthority
    } ./programs/beyond.wasm new_default_meta '${JSON.stringify(
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
    const promiseList = Object.keys(wlJson).map(async (nearAddress) => {
      const whiltelistCommand = `NEAR_ENV=${env} near call ${
        config.walletAuthority
      } add_whitelist_account '${JSON.stringify({
        account_id: nearAddress,
        allowance: wlJson[nearAddress],
      })}' --accountId ${config.walletAuthority}`;
      const { stdout: _stdoutAdd, stderr: _stderrAdd } = await execAsync(
        whiltelistCommand,
        {
          encoding: "utf-8",
        }
      );

      // Verify Whitelist
      const verifyWhiltelistCommand = `NEAR_ENV=${env} near view ${
        config.walletAuthority
      } get_wl_allowance '${JSON.stringify({
        account_id: nearAddress,
      })}' --accountId ${config.walletAuthority}`;

      const { stdout: stdoutVerify, stderr: _stderrVerify } = await execAsync(
        verifyWhiltelistCommand,
        {
          encoding: "utf-8",
        }
      );

      const regexForWlCount = "\n([0-9]+)\n";
      const match = stdoutVerify.match(regexForWlCount);

      let error = false;
      if (!match) {
        error = true;
      }

      if (!error) {
        const currentWhitelistAllowance = parseInt(match[1]);
        if (currentWhitelistAllowance !== wlJson[nearAddress]) {
          error = true;
        } else {
          console.log(
            `Whitelisting successful: ${nearAddress} for allowance ${wlJson[nearAddress]}`
          );
        }
      }

      if (error) {
        console.log(`Whitelisting of ${nearAddress} failed, please try again!`);
      }
    });

    await Promise.all(promiseList);
    process.exit(0);
  });

function programCommand(name: string) {
  return program.command(name);
}

program.parse(process.argv);
