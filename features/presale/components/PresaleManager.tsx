"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Coins, Wallet, ArrowDownToLine, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  findConfigPda,
  findSolVaultPda,
  findTokenVaultPda,
  getProgramId,
  SPINE_MINT,
  TOKEN_PROGRAM,
} from "@/features/presale/lib/pda";
import { presaleConfig, presaleRpcEndpoint } from "@/features/presale/config";

async function sha256Discriminator(name: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`global:${name}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash.slice(0, 8));
}

function encodeU64(val: number | bigint): Uint8Array {
  const buf = new Uint8Array(8);
  buf.set(new Uint8Array(new BigUint64Array([BigInt(val)]).buffer), 0);
  return buf;
}

export function PresaleManager() {
  const { publicKey, sendTransaction } = useWallet();
  const connection = useMemo(
    () => new Connection(presaleRpcEndpoint, "confirmed"),
    [],
  );
  const [loading, setLoading] = useState(false);
  const [configData, setConfigData] = useState<{
    authority: string;
    tokenMint: string;
    pricePerToken: number;
    saleStart: number;
    saleEnd: number;
    hardCapTokens: number;
    tokensSold: number;
    isFinalized: boolean;
  } | null>(null);
  const [solVaultBalance, setSolVaultBalance] = useState(0);
  const [tokenVaultBalance, setTokenVaultBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const programId = useMemo(() => getProgramId(), []);
  const adminWallet = useMemo(() => new PublicKey(presaleConfig.adminWallet), []);

  const configPda = useMemo(() => {
    try {
      return findConfigPda(adminWallet, programId)[0];
    } catch {
      return null;
    }
  }, [adminWallet, programId]);

  const solVaultPda = useMemo(() => {
    if (!configPda) return null;
    return findSolVaultPda(configPda, programId)[0];
  }, [configPda, programId]);

  const tokenVaultPda = useMemo(() => {
    if (!configPda) return null;
    return findTokenVaultPda(configPda, programId)[0];
  }, [configPda, programId]);

  useEffect(() => {
    if (!configPda || !solVaultPda || !tokenVaultPda) return;

    const fetchData = async () => {
      try {
        const configAcc = await connection.getAccountInfo(configPda);
        if (configAcc && configAcc.data.length >= 8) {
          const d = configAcc.data;
          const offset = 8;
          setConfigData({
            authority: new PublicKey(d.subarray(offset, offset + 32)).toBase58(),
            tokenMint: new PublicKey(d.subarray(offset + 32, offset + 64)).toBase58(),
            pricePerToken: Number(d.readBigUInt64LE(offset + 64)),
            saleStart: Number(d.readBigInt64LE(offset + 72)),
            saleEnd: Number(d.readBigInt64LE(offset + 80)),
            hardCapTokens: Number(d.readBigUInt64LE(offset + 104)),
            tokensSold: Number(d.readBigUInt64LE(offset + 112)),
            isFinalized: d[offset + 120] === 1,
          });
        }

        const solBal = await connection.getBalance(solVaultPda);
        setSolVaultBalance(solBal / 1e9);

        const tokenAcc = await connection.getParsedAccountInfo(tokenVaultPda);
        if (tokenAcc.value && typeof tokenAcc.value.data === "object" && "parsed" in tokenAcc.value.data) {
          const parsed = tokenAcc.value.data.parsed as { info: { tokenAmount: { uiAmount: number } } };
          setTokenVaultBalance(parsed.info.tokenAmount.uiAmount);
        }
      } catch (e) {
        console.error("Failed to fetch presale data:", e);
      }
    };

    fetchData();
  }, [connection, configPda, solVaultPda, tokenVaultPda]);

  const handleWithdrawSol = async () => {
    if (!publicKey || !sendTransaction || !configPda || !solVaultPda) return;
    setLoading(true);
    try {
      const lamports = Math.floor(Number(withdrawAmount) * 1e9);
      const disc = await sha256Discriminator("withdraw_sol");

      const ix = new TransactionInstruction({
        programId,
        data: Buffer.from(Buffer.concat([disc, encodeU64(lamports)])),
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPda, isSigner: false, isWritable: false },
          { pubkey: solVaultPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
      });

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      toast.add({ title: "SOL Withdrawn", description: `TX: ${sig.slice(0, 8)}...`, type: "success" });
      setWithdrawAmount("");
    } catch (err) {
      toast.add({ title: "Withdraw failed", description: err instanceof Error ? err.message : "Unknown", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!publicKey || !sendTransaction || !configPda) return;
    setLoading(true);
    try {
      const disc = await sha256Discriminator("finalize_presale");

      const ix = new TransactionInstruction({
        programId,
        data: Buffer.from(disc),
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: configPda, isSigner: false, isWritable: true },
        ],
      });

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      toast.add({ title: "Presale Finalized", description: `TX: ${sig.slice(0, 8)}...`, type: "success" });
    } catch (err) {
      toast.add({ title: "Finalize failed", description: err instanceof Error ? err.message : "Unknown", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!configData) {
    return <p className="text-sm text-muted-foreground">Loading presale config...</p>;
  }

  const progress = configData.hardCapTokens > 0
    ? ((configData.tokensSold / configData.hardCapTokens) * 100).toFixed(2)
    : "0";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SOL Collected</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solVaultBalance.toFixed(4)} SOL</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Sold</CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configData.tokensSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {progress}% of {configData.hardCapTokens.toLocaleString()} cap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Token Vault</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenVaultBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">SPINE in vault</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Presale Info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Program</span>
            <span className="font-mono text-xs">{programId.toBase58()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Mint</span>
            <span className="font-mono text-xs">{configData.tokenMint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per Token</span>
            <span>{configData.pricePerToken} lamports</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sale Period</span>
            <span>
              {new Date(configData.saleStart * 1000).toLocaleDateString()} - {new Date(configData.saleEnd * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={configData.isFinalized ? "text-destructive" : "text-emerald-500"}>
              {configData.isFinalized ? "Finalized" : "Active"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="SOL amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              step="0.001"
              min="0"
            />
            <Button
              onClick={handleWithdrawSol}
              disabled={loading || !withdrawAmount || Number(withdrawAmount) <= 0}
              className="gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
              Withdraw SOL
            </Button>
          </div>
          {!configData.isFinalized && (
            <Button onClick={handleFinalize} disabled={loading} variant="destructive" className="gap-2">
              Finalize Presale
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
