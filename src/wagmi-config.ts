import { http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

/**
 * Builds the wagmi/RainbowKit config using the runtime-provided RPC URL.
 * Created at bootstrap (after the runtime config.json has been loaded) so the
 * Ankr endpoint can be supplied at deploy time rather than baked into the build.
 */
export function createWagmiConfig(rpcUrl: string) {
  return getDefaultConfig({
    appName: 'Gwei Names',
    projectId: '3bd0ad741725d54fbc9a4c7b6545720e',
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(rpcUrl)
    },
    ssr: false
  });
}
