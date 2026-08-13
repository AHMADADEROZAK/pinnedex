import { createSolanaClient, type Address, type TransactionSigner } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

export type SolanaConfig = {
  rpcUrl?: string;
  keypairPath?: string;
};

export function createPresaleClient(config?: SolanaConfig) {
  const rpc = config?.rpcUrl ?? "http://localhost:8899";
  const { rpc: rpcClient, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: rpc,
  });
  return { rpc: rpcClient, sendAndConfirmTransaction };
}

export async function loadSigner(path?: string): Promise<TransactionSigner> {
  const keypath = path ?? process.env.HOME + "/.config/solana/id.json";
  return loadKeypairSignerFromFile(keypath);
}

export { type Address };
