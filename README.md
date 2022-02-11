# Beyond

## Deploy the contract for your NFT collection:

Get your images and metadata JSON files in the structure same as that of the example-assets folder. Let's say you saved your assets at path_assets.

1. Create your configuration file in the structure shown in example-beyond-config.json. Let's say you created your config file at path_config.
2. Get your NFT Storage API key from https://nft.storage/files/ to save it in the nftStorageApiKey field.
3. Verify your assets by running the following command:

```sh
ts-node src/beyond-cli.ts verify_assets -d path_assets -n <number of image+jsons>
```

4. Upload your assets by running the following command:

```sh
ts-node src/beyond-cli.ts upload_assets -d path_assets -cf path_config
```

5. Install near-cli by following instructions from https://docs.near.org/docs/tools/near-cli#installation
6. Login to near-cli using your NEAR account, on which you want to deploy the NFT contract. This must match with the walletAuthority account present in the configuration file.

```sh
NEAR_ENV=mainnet near login
```

7. Deploy the contract by running the following command:

```sh
ts-node src/beyond-cli.ts upload_assets -e mainnet -cf path_config
```

8. Create your whitelist file in the structure shown in example-beyond-whitelist-addresses.json. Let's say you created your config file at path_whitelist.
9. Whitelist addresses by running the following command:

```sh
ts-node src/beyond-cli.ts upload_assets -e mainnet -cf path_config -wj path_whitelist
```
