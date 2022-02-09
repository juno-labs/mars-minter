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
