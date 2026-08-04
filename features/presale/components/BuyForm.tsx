"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Copy, Send } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/format";
import { WalletManager } from "@/features/wallet/components/WalletManager";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { submitPurchase } from "@/features/presale/actions/presale";

export interface BuyFormConfig {
  collectionWallet: string;
  tokenPriceUsd: number;
  solPriceUsd: number;
  minTokens: number;
  maxTokens: number;
}

type BuyFormValues = {
  tokens: number;
  signature: string;
};

export function BuyForm({
  config,
  linkedWallets,
}: {
  config: BuyFormConfig;
  linkedWallets: string[];
}) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const buySchema = z.object({
    tokens: z
      .number()
      .min(config.minTokens, `At least ${config.minTokens} tokens.`)
      .max(config.maxTokens, `At most ${config.maxTokens} tokens.`),
    signature: z.string().min(1, "Transaction signature is required."),
  });

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buySchema),
    defaultValues: { tokens: config.minTokens, signature: "" },
  });

  const tokens = useWatch({ control: form.control, name: "tokens" });
  const signature = useWatch({ control: form.control, name: "signature" });
  const solNeeded =
    (tokens * config.tokenPriceUsd) / config.solPriceUsd;

  const handleSend = async () => {
    setError(null);
    if (!connected || !publicKey || !sendTransaction) {
      setError("Connect your wallet to send SOL.");
      return;
    }

    setSending(true);
    try {
      const lamports = Math.round(solNeeded * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(config.collectionWallet),
          lamports,
        }),
      );

      const sig = await sendTransaction(tx, connection);
      form.setValue("signature", sig);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed.";
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
    navigator.clipboard.writeText(config.collectionWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  async function onSubmit(values: BuyFormValues) {
    setPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.set("signature", values.signature);

    const state = await submitPurchase(undefined, formData);
    setPending(false);

    if (state?.error) {
      setServerError(state.error);
    }
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
      <div className="flex flex-col gap-3">
        <Controller
          name="tokens"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tokens">
                Tokens ({config.minTokens} - {config.maxTokens})
              </FieldLabel>
              <Input
                id="tokens"
                type="number"
                min={config.minTokens}
                max={config.maxTokens}
                value={Number.isFinite(field.value) ? field.value : ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Slider
          min={config.minTokens}
          max={config.maxTokens}
          step={1}
          value={[Number.isFinite(tokens) ? tokens : config.minTokens]}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number") form.setValue("tokens", next);
          }}
          className="w-full"
        />
      </div>

      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Price</span>
          <span>{formatUsd(config.tokenPriceUsd)} / token</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">You pay</span>
          <span className="font-mono font-medium">
            {solNeeded.toFixed(4)} SOL (≈ {formatUsd(solNeeded * config.solPriceUsd)})
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Collection wallet</span>
          <button
            type="button"
            onClick={copyAddress}
            className="flex items-center gap-1 font-mono text-primary hover:underline"
          >
            {copied ? "Copied!" : <Copy className="size-3.5" />}
          </button>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
          {config.collectionWallet}
        </p>
      </div>

      {!connected ? (
        <div className="flex flex-col gap-2">
          <ConnectWallet />
          {linkedWallets.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Then link a wallet to record your purchase.
            </p>
          )}
        </div>
      ) : (
        <Button type="button" onClick={handleSend} disabled={sending} className="gap-2">
          <Send className="size-4" />
          {sending ? "Sending..." : `Send ${solNeeded.toFixed(4)} SOL`}
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

      {signature && (
        <Controller
          name="signature"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signature">
                Transaction sent! Confirm to verify:
              </FieldLabel>
              <Input
                {...field}
                id="signature"
                className="font-mono"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      {signature && (
        <Button type="submit" disabled={pending}>
          {pending ? "Verifying..." : "Verify Purchase"}
        </Button>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      </form>

      <div className="mt-4 border-t pt-4">
        <p className="mb-2 text-sm text-muted-foreground">Linked wallets:</p>
        <WalletManager linkedWallets={linkedWallets} />
      </div>
    </>
  );
}
