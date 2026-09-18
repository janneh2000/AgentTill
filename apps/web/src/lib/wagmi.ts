"use client";

import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { injected } from "@wagmi/core";
import { arcMainnet, arcTestnet } from "@/config/chains";
import { getWalletConnectProjectId } from "@/config/env";

/**
 * Wagmi config for Arc.
 * Injected wallets always work. WalletConnect requires NEXT_PUBLIC_WC_PROJECT_ID;
 * we intentionally avoid importing the wagmi/connectors barrel (pulls Coinbase/MetaMask SDK trees).
 */
export function createWagmiConfig() {
  const wcId = getWalletConnectProjectId();
  void wcId; // reserved for future dedicated WC connector wiring

  return createConfig({
    chains: [arcTestnet, arcMainnet],
    connectors: [injected({ shimDisconnect: true })],
    transports: {
      [arcTestnet.id]: http("https://rpc.testnet.arc.io"),
      [arcMainnet.id]: http("https://rpc.mainnet.arc.io"),
    },
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
  });
}

export const wagmiConfig = createWagmiConfig();
