"use client";

import { useState } from "react";
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Check, Copy, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";

export function FeePayment({
  label,
  feeSol,
  collectionWallet,
  onSignature,
}: {
  label: string;
  feeSol: number;
  collectionWallet: string;
  onSignature: (signature: string) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paidSig, setPaidSig] = useState<string | null>(null);

  const lamports = Math.round(feeSol * LAMPORTS_PER_SOL);

  const handleSend = async () => {
    setError(null);
    if (!connected || !publicKey || !sendTransaction) {
      setError("Connect your wallet to send SOL.");
      return;
    }

    setSending(true);
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(collectionWallet),
          lamports,
        }),
      );
      const sig = await sendTransaction(tx, connection);
      setPaidSig(sig);
      onSignature(sig);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed.";
      const cancelled =
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("denied");

      if (cancelled) {
        toast.add({
          title: "Transaction cancelled",
          description: "You closed or rejected the request in your wallet.",
          type: "warning",
        });
      } else {
        setError(message);
      }
    } finally {
      setSending(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(collectionWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{feeSol} SOL</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 break-all font-mono text-xs text-muted-foreground">
          {collectionWallet}
        </span>
        <button
          type="button"
          onClick={copyAddress}
          className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
        >
          {copied ? "Copied!" : <Copy className="size-3.5" />}
        </button>
      </div>
      {!connected ? (
        <ConnectWallet />
      ) : paidSig ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Check className="size-3.5" />
          Fee paid — submitted on confirmation.
        </p>
      ) : (
        <Button type="button" onClick={handleSend} disabled={sending} className="gap-2">
          <Send className="size-4" />
          {sending ? "Sending..." : `Pay ${feeSol} SOL`}
        </Button>
      )}

      {error && (
        <AlertDialog open onOpenChange={() => setError(null)}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Transaction failed</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setError(null)} className="w-full">
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
