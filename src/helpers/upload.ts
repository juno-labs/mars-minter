// @ts-nocheck
import { File, NFTStorage } from "nft.storage";
import * as fs from "fs/promises";
import * as path from "path";

declare interface File {
  _parts: any[];
}

async function cleanFiles(baseDir): Promise<typeof File[][]> {
  console.log({ baseDir });
  const images = await fs.readdir(
    path.join(__dirname, `${baseDir}/images`, "")
  );
  console.log("images loaded");
  const files = await Promise.all(
    images.map(async (img) => {
      console.log({ img });
      const id = path.basename(img, path.extname(img));
      const jsonFile = (
        await fs.readFile(path.join(baseDir, "jsons", `${id_}.json`))
      ).toString();
      return [
        new File([await fs.readFile(baseDir)], `${id}.png`),
        new File([jsonFile], `${id}.json`),
      ];
    })
  );

  return files;
}

export const uploadNftStorage = async (apiKey, baseDir) => {
  console.log({ apiKey, baseDir });
  const initialFiles = await cleanFiles(baseDir);
  console.log(initialFiles);
};
