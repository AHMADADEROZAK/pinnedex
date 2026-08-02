import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const solanaNetwork: WalletAdapterNetwork =
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet"
    ? WalletAdapterNetwork.Mainnet
    : process.env.NEXT_PUBLIC_SOLANA_NETWORK === "testnet"
      ? WalletAdapterNetwork.Testnet
      : WalletAdapterNetwork.Devnet;

export const solanaRpcClientPath = "/api/rpc";

export const networkLabel: Record<WalletAdapterNetwork, string> = {
  [WalletAdapterNetwork.Mainnet]: "Mainnet",
  [WalletAdapterNetwork.Devnet]: "Devnet",
  [WalletAdapterNetwork.Testnet]: "Testnet",
};
