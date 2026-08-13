"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Wallet, ExternalLink } from "lucide-react";

import {
  findConfigPda,
  findVestingPda,
  getProgramId,
} from "@/features/presale/lib/pda";
import { presaleConfig } from "@/features/presale/config";
import { ClaimButton } from "./ClaimButton";
import { solanaNetworkName } from "@/features/solana";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface VestingData {
  totalTokens: number;
  claimedAmount: number;
  startTs: number;
  cliffTs: number;
  endTs: number;
}

function calculateClaimable(data: VestingData, now: number): number {
  if (now < data.cliffTs) return 0;
  if (now >= data.endTs) return Math.max(0, data.totalTokens - data.claimedAmount);

  const elapsed = now - data.startTs;
  const duration = data.endTs - data.startTs;
  if (duration <= 0) return 0;

  const vested = Math.floor((data.totalTokens * elapsed) / duration);
  return Math.max(0, vested - data.claimedAmount);
}

export function AllocationSection() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VestingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programId = useMemo(() => getProgramId(), []);
  const adminWallet = useMemo(() => new PublicKey(presaleConfig.adminWallet), []);

  const fetchAllocation = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const [configPda] = findConfigPda(adminWallet, programId);
      const [vestingPda] = findVestingPda(configPda, publicKey, programId);
      const acc = await connection.getAccountInfo(vestingPda);
      if (!acc || acc.data.length < 8) {
        setData(null);
        return;
      }
      const d = acc.data;
      const offset = 8; // discriminator
      const beneficiary = new PublicKey(d.subarray(offset, offset + 32));
      if (beneficiary.toString() !== publicKey.toString()) {
        setData(null);
        return;
      }
      // VestingSchedule: start_ts(8), cliff_ts(8), end_ts(8), total_amount(8)
      const startTs = Number(d.readBigInt64LE(offset + 32));
      const cliffTs = Number(d.readBigInt64LE(offset + 40));
      const endTs = Number(d.readBigInt64LE(offset + 48));
      const totalTokens = Number(d.readBigUInt64LE(offset + 56));
      const claimedAmount = Number(d.readBigUInt64LE(offset + 64));

      setData({
        totalTokens,
        claimedAmount,
        startTs,
        cliffTs,
        endTs,
      });
    } catch {
      setError("Failed to load allocation");
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, adminWallet, programId]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  const now = Math.floor(Date.now() / 1000);
  const claimable = data ? calculateClaimable(data, now) : 0;

  if (!connected || !publicKey) return null;

  const explorerCluster = solanaNetworkName === "mainnet-beta" ? "" : `?cluster=${solanaNetworkName}`;

  return (
    <section className="flex flex-col gap-4 rounded-md border bg-card p-4">
      <div className="flex items-center gap-2">
        <Wallet className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">
          My Allocation
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            No allocation found for this wallet.
          </p>
          <a
            href={`https://explorer.solana.com/address/${publicKey.toString()}${explorerCluster}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <span className="truncate">{shortenAddress(publicKey.toString())}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Tokens purchased</span>
            <span className="font-medium tabular-nums">
              {data.totalTokens.toLocaleString()} SPINE
            </span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Claimed</span>
            <span className="font-medium tabular-nums">
              {data.claimedAmount.toLocaleString()} / {data.totalTokens.toLocaleString()}
            </span>
          </p>
          {data.cliffTs > now ? (
            <p className="text-xs text-muted-foreground">
              Cliff ends{" "}
              {new Date(data.cliffTs * 1000).toLocaleDateString()}
            </p>
          ) : claimable > 0 ? (
            <ClaimButton claimable={claimable} onClaimed={fetchAllocation} />
          ) : (
            <p className="text-xs text-muted-foreground">Fully claimed</p>
          )}
        </div>
      )}
    </section>
  );
}
