import { program } from "commander";
import assert from "assert";
import dayjs from "dayjs";
import fs from "fs";
import { NEAR } from "near-willem-workspaces";
import path from "path";
import {
  addMediaUri,
  deployAndInitializeMarsMinter,
  getAccount,
  whitelistAccount,
} from "./helpers/nearUtils";
import { uploadNftStorage } from "./helpers/upload";
import {
  validateConfigurationFile,
  verifyAssets,
} from "./helpers/verification";

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
  .action(async (options: any, cmd: any) => {
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
      base_cost: NEAR.parse(`${config.costInNear} N`),
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

    await deployAndInitializeMarsMinter(env, config.walletAuthority, initDict);

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
    const { walletAuthority: contractId } = config;
    const adminAccount = await getAccount(env, contractId);
    const promiseList = Object.keys(wlJson).map(async (nearAddress) => {
      await whitelistAccount(
        adminAccount,
        contractId,
        nearAddress,
        wlJson[nearAddress]
      );
    });
    await Promise.all(promiseList);
    console.log(`Done ???`);
    process.exit(0);
  });

// Update media URIs
programCommand("update_media_uri")
  .option(
    "-e, --env <string>",
    "NEAR cluster env name. One of: mainnet, testnet",
    "testnet"
  )
  .requiredOption(
    "-muj, --media-uri-json <string>",
    "Path of the json file containing media URIs"
  )
  .requiredOption("-cf, --config <string>", "Path of the config file")
  .action(async (options) => {
    const { env } = options;
    const config = JSON.parse(fs.readFileSync(options.config, "utf8"));
    const mediaUriList = JSON.parse(
      fs.readFileSync(options.mediaUriJson, "utf8")
    );
    const { walletAuthority: contractId } = config;
    const adminAccount = await getAccount(env, contractId);
    assert.ok(
      mediaUriList.length === config.size,
      "Media URIs length mismatch"
    );
    const promiseList = mediaUriList.map(
      async (mediaUri: string, index: number) => {
        await addMediaUri(adminAccount, contractId, index.toString(), mediaUri);
      }
    );
    await Promise.all(promiseList);
    console.log(`Done ???`);
    process.exit(0);
  });

function programCommand(name: string) {
  return program.command(name);
}

program.parse(process.argv);
