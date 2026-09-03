"use client";

import { useState } from "react";
import {
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Send, CheckCircle2, AlertCircle, Unplug, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

import { WorldPhoneCode } from "@/features/signal/components/WorldPhoneCode";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import {
  connectTelegram,
  disconnectTelegram,
} from "@/features/signal/actions/signal";
import type { ConnectTelegramState } from "@/features/signal/actions/signal";

type TelegramStatus = "none" | "pending" | "connected";

interface TelegramConnectProps {
  isMember: boolean;
  status: TelegramStatus;
  botUsername: string;
  feeSol: number;
  collectionWallet: string;
  linkCode?: string;
}

export function TelegramConnect({
  isMember,
  status,
  botUsername,
  feeSol,
  collectionWallet,
  linkCode,
}: TelegramConnectProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);

  const username = botUsername.replace(/^@/, "");
  const link = newLink ?? (status === "pending" && username && linkCode
    ? `https://t.me/${username}?start=${linkCode}`
    : null);

  const validatePhone = (v: string): string | null =>
    /^\+?\d{8,15}$/.test(v.trim())
      ? null
      : "Enter a valid phone number with country code.";

  const onSubmit = async () => {
    setError(null);
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!collectionWallet) {
      setError("Collection wallet not configured.");
      return;
    }

    if (!connected || !publicKey || !sendTransaction) return;

    setPending(true);

    try {
      const lamports = Math.round(feeSol * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(collectionWallet),
          lamports,
        }),
      );
      const sig = await sendTransaction(tx, connection);

      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("signature", sig);

      const state: ConnectTelegramState = await connectTelegram({}, fd);

      if (state?.errors) {
        const phoneMsg = state.errors.phone?.[0];
        const sigMsg = state.errors.signature?.[0];
        setError(phoneMsg ?? sigMsg ?? "Failed to connect Telegram.");
        setPending(false);
        return;
      }
      if (state?.message) {
        setError(state.message);
        setPending(false);
        return;
      }
      if (state?.link) {
        setNewLink(state.link);
      }

      toast.add({
        title: "Payment received",
        description: "Open the bot link and press Start to finish connecting.",
        type: "success",
      });
      setPending(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed.";
      if (
        !message.toLowerCase().includes("rejected") &&
        !message.toLowerCase().includes("cancel") &&
        !message.toLowerCase().includes("denied")
      ) {
        setError(message);
      }
      setPending(false);
    }
  };

  const onDisconnect = async () => {
    setDisconnecting(true);
    await disconnectTelegram();
    setDisconnecting(false);
    setNewLink(null);
    router.refresh();
  };

  if (!isMember) {
    return (
      <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground">
        <div className="mb-2 flex items-center gap-2">
          <Send className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Connect Telegram</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Activate a membership to connect Telegram and receive real-time CTO
          takeover alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground">
      <div className="mb-2 flex items-center gap-2">
        <Send className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Connect Telegram</h2>
        {status === "connected" && (
          <CheckCircle2 className="size-5 text-green-500" />
        )}
      </div>

      {status === "connected" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Connected to Telegram. You will receive CTO takeover alerts in the
            bot chat.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 self-start"
            disabled={disconnecting}
            onClick={onDisconnect}
          >
            {disconnecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Unplug className="size-4" />
            )}
            Disconnect
          </Button>
        </div>
      ) : link ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Open this link in Telegram, then press <b>Start</b> to link the chat
            to your account (valid for 15 minutes).
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all rounded-md border border-primary/40 bg-primary/5 px-3 py-2 font-mono text-xs text-primary"
          >
            {link}
          </a>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => router.refresh()}
            >
              Check status
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={disconnecting}
              onClick={onDisconnect}
            >
              {disconnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unplug className="size-4" />
              )}
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter your Telegram phone number and pay {feeSol} SOL to connect your
            account.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <WorldPhoneCode onChange={setPhone} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
              <Crown className="size-3.5 text-amber-500" />
              <span className="text-xs font-medium">
                {feeSol} SOL
                <span className="ml-1 font-normal text-muted-foreground">
                  to subscribe
                </span>
              </span>
            </div>
            {/* {!connected ? (
              <ConnectWallet />
            ) : (
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={pending || !phone.trim()}
                onClick={onSubmit}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {pending ? "Connecting…" : "Connect"}
              </Button>
            )} */}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
