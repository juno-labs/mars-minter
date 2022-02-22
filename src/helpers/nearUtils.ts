import { program } from "commander";
import dayjs from "dayjs";
import assert from "assert";
import fs from "fs";
import { Gas, NEAR } from "near-willem-workspaces";

const { keyStores, connect, transactions } = require("near-api-js");
const path = require("path");
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";

program.version("0.0.2");

const BEYOND_WASM_PATH = "./programs/beyond.wasm";

const nodeUrlMap: any = {
  mainnet: "https://rpc.mainnet.near.org",
  testnet: "https://rpc.testnet.near.org",
};

export const getAccount = async (env: string, accountId: string) => {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

  const config = {
    keyStore,
    networkId: env,
    nodeUrl: nodeUrlMap[env],
  };

  const near = await connect(config);
  const account = await near.account(accountId);
  return account;
};

export const deployAndInitializeBeyond = async (
  env: string,
  accountId: string,
  initialData: any
) => {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

  const config = {
    keyStore,
    networkId: env,
    nodeUrl: nodeUrlMap[env],
  };

  const near = await connect(config);
  const account = await near.account(accountId);

  const epochNext060sec = dayjs().unix() + 60;
  const epochNext300sec = dayjs().unix() + 300;

  const accountState = await account.state();

  const { code_hash: codeHash } = accountState;

  const emptyCodeHashList = ["11111111111111111111111111111111"];

  if (emptyCodeHashList.includes(codeHash)) {
    const result = await account.signAndSendTransaction({
      receiverId: accountId,
      actions: [
        transactions.deployContract(fs.readFileSync(BEYOND_WASM_PATH)),
        transactions.functionCall(
          "new_default_meta",
          initialData,
          Gas.parse("20 TGas")
        ),
      ],
    });
    console.log("Contract is deployed 🚀");
  } else {
    console.log("Contract is already deployed!!");
  }
};

const getCurrentWhitelistAllowance = async (
  adminAccount: any,
  contractId: string,
  accountId: string
) => {
  let currentAllowance = 0;
  try {
    currentAllowance = await adminAccount.viewFunction(
      contractId,
      "get_wl_allowance",
      {
        account_id: accountId,
      }
    );
  } catch (error) {
    // Error will be thrown for the accounts which are not whitelisted
  }

  return currentAllowance;
};

export const whitelistAccount = async (
  adminAccount: any,
  contractId: string,
  accountId: string,
  allowance: number
) => {
  try {
    let currentAllowance = 0;

    currentAllowance = await getCurrentWhitelistAllowance(
      adminAccount,
      contractId,
      accountId
    );

    if (currentAllowance !== allowance) {
      await adminAccount.functionCall({
        contractId,
        methodName: "add_whitelist_account",
        args: { account_id: accountId, allowance },
        gas: Gas.parse("30Tgas"),
      });
    } else {
      return;
    }

    currentAllowance = await getCurrentWhitelistAllowance(
      adminAccount,
      contractId,
      accountId
    );

    assert.ok(currentAllowance === allowance);
  } catch (error) {
    console.log({
      accountId,
      error,
    });
  }
};
