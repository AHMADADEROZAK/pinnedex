import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type SolanaNetworkName = "devnet" | "testnet" | "mainnet-beta";

/** Normalize env value: accepts "devnet" | "testnet" | "mainnet" | "mainnet-beta". */
export function resolveSolanaNetwork(value?: string): SolanaNetworkName {
  const v = (value ?? "").toLowerCase();
  if (v === "mainnet" || v === "mainnet-beta") return "mainnet-beta";
  if (v === "testnet") return "testnet";
  return "devnet";
}

export const solanaNetworkName: SolanaNetworkName = resolveSolanaNetwork(
  process.env.NEXT_PUBLIC_SOLANA_NETWORK,
);

export const solanaNetwork: WalletAdapterNetwork =
  solanaNetworkName === "mainnet-beta"
    ? WalletAdapterNetwork.Mainnet
    : solanaNetworkName === "testnet"
      ? WalletAdapterNetwork.Testnet
      : WalletAdapterNetwork.Devnet;

// export const isDevnet = solanaNetworkName === "devnet";
export const isDevnet = "devnet";
export const isMainnet = solanaNetworkName === "mainnet-beta";

export const solanaRpcClientPath = "/api/rpc";

export const networkLabel: Record<WalletAdapterNetwork, string> = {
  [WalletAdapterNetwork.Mainnet]: "Mainnet",
  [WalletAdapterNetwork.Devnet]: "Devnet",
  [WalletAdapterNetwork.Testnet]: "Testnet",
};
