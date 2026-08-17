# Gwei Names by cp0x

语言: [English](./README.md) | [中文](./README_CH.md)

一个开源、无需许可的界面，通过 NameNFT 与 SubdomainRegistrar 合约挖取 `.gwei` 子域名
（例如 `yourname.cp0x.gwei`）。

## 工作原理

1. 输入名称并提交，即可挖取 `<name>.cp0x.gwei`。
2. 应用调用 `NameNFT.isAvailable(<name>, <parentId>)` 检查该名称是否可用。
3. 如果可用，则调用 `SubdomainRegistrar.register(<parentId>, <name>)` 铸造该子域名。

## 运行时配置

合约地址、父域名 namehash 和 RPC URL 在运行时从
[`public/config.json`](./public/config.json) 读取 —— 它们**不会**被打包进构建产物。
因此你可以在部署时（例如通过 docker compose）替换它们，而无需重新构建镜像。

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

## 本地开发

```bash
pnpm install
pnpm start
```

## Docker

```bash
docker compose up --build
```

容器会在 `4173` 端口提供构建后的应用。`config.json` 从宿主机挂载
（参见 [`docker-compose.yml`](./docker-compose.yml)），因此只需编辑该文件并重启容器，
即可让应用指向不同的合约 / RPC。

## 相关链接
- 网站: [gwei.cp0x.com](https://gwei.cp0x.com/)
- Twitter: [@cp0xdotcom](https://x.com/cp0xdotcom)
- Telegram: [@cp0xdotcom](https://t.me/cp0xdotcom)

## 参与贡献

关于本地部署、开发与代码贡献的步骤，请参见 [CONTRIBUTING](./CONTRIBUTING.md)。
