// @ts-nocheck
import { File, NFTStorage } from "nft.storage";
import * as fs from "fs/promises";
import * as path from "path";

declare interface File {
  _parts: any[];
}

async function iterateFiles(baseDir): Promise<typeof File[][]> {
  const images = await fs.readdir(`${baseDir}/images`);
  const files = await Promise.all(
    images.map(async (img) => {
      const id = path.basename(img, path.extname(img));
      const jsonFile = (
        await fs.readFile(`${baseDir}/jsons/${id}.json`)
      ).toString();
      return [
        new File([await fs.readFile(`${baseDir}/images/${img}`)], `${id}.png`),
        new File([jsonFile], `${id}.json`),
      ];
    })
  );
  return files;
}

export const uploadNftStorage = async (apiKey, baseDir) => {
  const initialFiles = await iterateFiles(baseDir);
  console.log("\n === Loaded assests ===");
  const client = new NFTStorage({ token: apiKey });
  console.log("\n === Initialized NFT Storage Client ===");
  const CID = await client.storeDirectory(initialFiles.flat());
  console.log("\n === Finished upload & saved IPFS CID ===\n", CID);
};
