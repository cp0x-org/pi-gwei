# Gwei Names by cp0x

Languages: [English](./README.md) | [中文](./README_CH.md)

An open-source, permissionless interface for mining `.gwei` subdomains (e.g. `yourname.cp0x.gwei`)
via the NameNFT and SubdomainRegistrar contracts.

## How it works

1. Enter a name and submit to mine `<name>.cp0x.gwei`.
2. The app calls `NameNFT.isAvailable(<name>, <parentId>)` to check availability.
3. If available, it calls `SubdomainRegistrar.register(<parentId>, <name>)` to mint the subdomain.

## Runtime configuration

Contract addresses, the parent namehash and the RPC URL are read at runtime from
[`public/config.json`](./public/config.json) — they are **not** baked into the build.
This lets you swap them at deploy time (e.g. via docker compose) without rebuilding the image.

```json
{
  "chainId": 1,
  "rpcUrl": "https://rpc.ankr.com/eth/<key>",
  "nameNFTAddress": "0x9D51D507BC7264d4fE8Ad1cf7Fe191933A0a81d6",
  "subdomainRegistrarAddress": "0xc1D5245bfd98dDB7E73B33209B346b4FC0E03f3c",
  "parentId": "107805715862713793743629675974231447291597916030156178037874673280786392894448",
  "parentName": "cp0x.gwei"
}
```

## Develop

```bash
pnpm install
pnpm start
```

## Docker

```bash
docker compose up --build
```

The container serves the built app on port `4173`. `config.json` is mounted from the host
(see [`docker-compose.yml`](./docker-compose.yml)), so editing it and restarting the
container is enough to point the app at different contracts / RPC.

## Application Links
- Website: [gwei.cp0x.com](https://gwei.cp0x.com/)
- Twitter: [@cp0xdotcom](https://x.com/cp0xdotcom)
- Telegram: [@cp0xdotcom](https://t.me/cp0xdotcom)

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).
