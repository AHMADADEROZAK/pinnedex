import { ShoppingCart } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { Purchase } from "@/features/presale";
import { solanaNetwork } from "@/features/solana";
import { PurchasesTable } from "./columns";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default async function AdminPurchasesPage() {
  await connectToDatabase();

  const purchases = await Purchase.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

  const explorerCluster =
    solanaNetwork === "mainnet-beta" ? "" : `?cluster=${solanaNetwork}`;

  const data = purchases.map((p) => ({
    wallet: shortenAddress(p.walletAddress),
    tokens: p.tokenAllocation,
    sol: (p.solLamports / 1e9).toFixed(4),
    status: p.status,
    txSignature: p.txSignature,
    txUrl: `https://explorer.solana.com/tx/${p.txSignature}${explorerCluster}`,
    date: new Date(p.createdAt).toLocaleString(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <ShoppingCart className="size-6 text-primary" />
        Purchases
      </h1>
      <PurchasesTable data={data} />
    </div>
  );
}
