import { ShoppingCart, ExternalLink } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { Purchase } from "@/features/presale";
import { solanaNetwork } from "@/features/solana";

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

  const txUrl = (sig: string) =>
    `https://explorer.solana.com/tx/${sig}${explorerCluster}`;

  const statusColor = (status: string) =>
    status === "verified"
      ? "text-emerald-600"
      : status === "rejected"
        ? "text-red-600"
        : "text-amber-600";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <ShoppingCart className="size-6 text-primary" />
        Purchases
      </h1>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Wallet</th>
              <th className="p-3 font-medium">Tokens</th>
              <th className="p-3 font-medium text-right">SOL</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Tx</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-muted-foreground">
                  No purchases yet.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.txSignature} className="border-b last:border-0">
                  <td className="p-3 font-mono">{shortenAddress(p.walletAddress)}</td>
                  <td className="p-3">{p.tokenAllocation.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">
                    {(p.solLamports / 1e9).toFixed(4)}
                  </td>
                  <td className={`p-3 ${statusColor(p.status)}`}>{p.status}</td>
                  <td className="p-3">
                    <a
                      href={txUrl(p.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3.5" />
                      <span className="font-mono text-xs">
                        {p.txSignature.slice(0, 8)}...
                      </span>
                    </a>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
