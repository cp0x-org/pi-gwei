// Runtime application config.
//
// Loaded at bootstrap from `${BASE_URL}config.json` (served from /public/config.json).
// This file can be replaced/mounted at deploy time (e.g. via docker compose) WITHOUT
// rebuilding the image, so contract addresses, the parent namehash and the RPC URL
// are all provided at runtime rather than baked in at build time.

import type { Address } from 'viem';

export interface AppConfig {
  /** EVM chain id the contracts are deployed on (Ethereum mainnet = 1). */
  chainId: number;
  /** JSON-RPC endpoint used by wagmi for reads/writes. */
  rpcUrl: string;
  /** NameNFT contract address. */
  nameNFTAddress: Address;
  /** SubdomainRegistrar contract address. */
  subdomainRegistrarAddress: Address;
  /** Parent namehash (uint256 as decimal string) under which subdomains are minted. */
  parentId: string;
  /** Human readable parent name, e.g. "cp0x.gwei". Used for display only. */
  parentName: string;
}

let _config: AppConfig | null = null;

/** Fetches and caches the runtime config. Must be awaited before rendering the app. */
export async function loadAppConfig(): Promise<AppConfig> {
  if (_config) return _config;

  const url = `${import.meta.env.BASE_URL}config.json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load runtime config from ${url}: ${res.status} ${res.statusText}`);
  }

  const cfg = (await res.json()) as AppConfig;

  // Fail fast on missing fields so misconfiguration is obvious at startup.
  const required: (keyof AppConfig)[] = ['chainId', 'rpcUrl', 'nameNFTAddress', 'subdomainRegistrarAddress', 'parentId', 'parentName'];
  for (const key of required) {
    if (cfg[key] === undefined || cfg[key] === null || cfg[key] === '') {
      throw new Error(`Runtime config is missing required field "${key}"`);
    }
  }

  _config = cfg;
  return _config;
}

/** Returns the already-loaded config. Throws if called before {@link loadAppConfig}. */
export function getAppConfig(): AppConfig {
  if (!_config) {
    throw new Error('App config accessed before it was loaded. Call loadAppConfig() first.');
  }
  return _config;
}
