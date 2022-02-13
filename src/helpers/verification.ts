// @ts-nocheck
import fs from "fs";
import Ajv from "ajv";

const ajv = new Ajv();

const metadataSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    attributes: { type: "array" },
  },
  required: ["title", "description", "attributes"],
  additionalProperties: true,
};
export const verifyAssets = (imgList, jsonList, numberOfAssets, baseDir) => {
  const verifiedImgCount = imgList.filter((imgFile) => {
    return imgFile.endsWith("png") || imgFile.endsWith("jpg");
  }).length;
  const verifiedJsonCount = jsonList.filter((jsonFile) => {
    return jsonFile.endsWith("json");
  }).length;
  if (verifiedImgCount !== verifiedJsonCount) {
    throw new Error(
      `number of img files is not the same as number of json files`
    );
  }
  if (
    numberOfAssets != verifiedImgCount &&
    numberOfAssets != verifiedJsonCount
  ) {
    throw new Error(`number of assets do not match collection count`);
  }
  const randomJsonFile = jsonList[Math.floor(Math.random() * jsonList.length)];
  const sampleJsonFile = JSON.parse(
    fs.readFileSync(`${baseDir}/jsons/${randomJsonFile}`, "utf8")
  );
  const compiledSchema = ajv.compile(metadataSchema);
  const isValid = compiledSchema(sampleJsonFile);
  if (!isValid) {
    throw new Error(`metadata isn't formatted correctly`);
  }
};

// Validator for config file

const INT_0_TO_100 = "Integer between 0 to 100";

const isValidPercentage = (x) => x >= 0 && x <= 100;

const isValidPayout = (payoutObject) => {
  let totalPayout = 0;
  for (const nearAddress in payoutObject) {
    const percentage = payoutObject[nearAddress];
    if (!isValidPercentage(percentage)) {
      console.log(`Invalid percentage for ${nearAddress}`);
      return false;
    }
    totalPayout += percentage;
  }
  if (totalPayout !== 100) {
    console.log(`Total payouts should add up to 100`);
    return false;
  }
  return true;
};

ajv.addFormat(INT_0_TO_100, {
  type: "number",
  validate: isValidPercentage,
});

export const configurationSchema = {
  type: "object",
  properties: {
    walletAuthority: { type: "string" },
    collectionName: { type: "string" },
    symbol: { type: "string" },
    description: { type: "string" },
    size: { type: "number" },
    costInNear: { type: "number" },
    premintStartDate: { type: "string" },
    publicMintStartDate: { type: "string" },
    initialsPayout: { type: "object" },
    royaltiesPayout: { type: "object" },
    ipfsLink: { type: "string" },
    royaltiesPercent: { type: "number", format: INT_0_TO_100 },
  },
  required: [
    "walletAuthority",
    "collectionName",
    "symbol",
    "description",
    "size",
    "costInNear",
    "premintStartDate",
    "publicMintStartDate",
    "initialsPayout",
    "royaltiesPayout",
    "royaltiesPercent",
    "ipfsLink",
  ],
  additionalProperties: true,
};

export const validateConfigurationFile = async (config) => {
  const validate = ajv.compile(configurationSchema);
  const isValid = validate(config);
  if (!isValid) {
    console.log(
      `Configuration file is not correct: \n${validate.errors
        ?.map((error) => `${error.instancePath}: ${error.message}`)
        .join("\n")}`
    );
    return false;
  }
  // Validate payouts
  if (!isValidPayout(config.initialsPayout)) {
    console.log(`Issue in initialsPayout`);
    return false;
  }
  if (!isValidPayout(config.royaltiesPayout)) {
    console.log(`Issue in royaltiesPayout`);
    return false;
  }
  return true;
};
