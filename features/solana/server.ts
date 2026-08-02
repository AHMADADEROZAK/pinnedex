import { clusterApiUrl } from "@solana/web3.js";

import { solanaNetwork } from "@/features/solana/config";

export const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getBalance",
  "getBlock",
  "getBlockHeight",
  "getBlockProduction",
  "getEpochInfo",
  "getFeeForMessage",
  "getHealth",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getProgramAccounts",
  "getSignatureStatuses",
  "getSignaturesForAddress",
  "getSlot",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getTransaction",
  "getVersion",
  "requestAirdrop",
  "sendTransaction",
  "simulateTransaction",
]);

export function resolveRpcEndpoint() {
  return process.env.SOLANA_RPC_ENDPOINT ?? clusterApiUrl(solanaNetwork);
}
