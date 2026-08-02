"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useStandardWalletAdapters } from "@solana/wallet-standard-wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: ReactNode;
  endpoint: string;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({
  children,
  endpoint,
}) => {
  const memoizedEndpoint = useMemo(() => endpoint, [endpoint]);

  const wallets = useStandardWalletAdapters([]);

  return (
    <ConnectionProvider endpoint={memoizedEndpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={() => {
          // Wallet adapter logs send errors to console by default.
          // Errors are surfaced to the user via the UI, so swallow them here.
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
