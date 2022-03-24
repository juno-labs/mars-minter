# Mars Minter

Want to launch your own project on NEAR? Mars Minter makes it easy. Feel free to make contributions to the code.

## Steps needed to launch a project

1. Have assets/art ready (this is on you, anon)
2. Verify and Upload assets
3. Deploy contract
4. Add whitelisted users (optional)
5. Connect to your frontend minting app (this is on you, anon)

## Launch your collection:

1. Get your images and metadata json files in the same structure as that in the `example-assets` folder.
2. Create your configuration file in the structure shown in `example-mars-minter-config.json`
3. Sign up for NFT Storage API key (it's free) and get an API key from https://nft.storage/files/ to save in the `nftStorageApiKey` field within the config.
4. Run `yarn install` in the mars-minter folder.
5. Verify your assets by running the following command:

```sh
ts-node src/mars-minter-cli.ts verify_assets -d example-assets -n <size-of-nft-collection>
```

6. Upload your assets by running the following command:

```sh
ts-node src/mars-minter-cli.ts upload_assets -d example-assets -cf example-mars-minter-config.json
```

7. Install `near-cli` by following instructions from [the official near docs](https://docs.near.org/docs/tools/near-cli#installation)

8. Login to `near-cli` using your NEAR account, on which you want to deploy the NFT contract. Note - this must match with the `walletAuthority` passed in your configuration file.

```sh
NEAR_ENV=mainnet near login
```

9. Deploy the contract by running the following command:

```sh
ts-node src/mars-minter-cli.ts deploy_contract -e mainnet -cf example-mars-minter-config.json
```

10. Create your whitelist file in the structure shown in `example-whitelist-addresses.json`.

11. Whitelist addresses by running the following command:

```sh
ts-node src/mars-minter-cli.ts whitelist -e mainnet -cf example-mars-minter-config.json -wj example-whitelist-addresses.json
```

## Advanced Usages

### Adding custom media URIs

```sh
ts-node src/mars-minter-cli.ts update_media_uri -e mainnet -cf example-mars-minter-config.json -muj ./example-media-uri-list.json
```
