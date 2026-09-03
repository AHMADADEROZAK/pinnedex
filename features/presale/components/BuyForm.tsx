"use client";

import { useState, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey,
  TransactionInstruction,
  Connection,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Send } from "lucide-react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/format";
import { WalletManager } from "@/features/wallet/components/WalletManager";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { submitPurchase } from "@/features/presale/actions/presale";
import {
  findConfigPda,
  findVestingPda,
  findSolVaultPda,
  getProgramId,
} from "@/features/presale/lib/pda";
import { presaleConfig, presaleRpcEndpoint } from "@/features/presale/config";

export interface BuyFormConfig {
  programId: string;
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

async function sha256Discriminator(name: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`global:${name}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash.slice(0, 8));
}

function encodeU64(value: number): Uint8Array {
  const buf = new Uint8Array(8);
  const big = BigInt(value);
  buf[0] = Number(big & BigInt(255));
  buf[1] = Number((big >> BigInt(8)) & BigInt(255));
  buf[2] = Number((big >> BigInt(16)) & BigInt(255));
  buf[3] = Number((big >> BigInt(24)) & BigInt(255));
  buf[4] = Number((big >> BigInt(32)) & BigInt(255));
  buf[5] = Number((big >> BigInt(40)) & BigInt(255));
  buf[6] = Number((big >> BigInt(48)) & BigInt(255));
  buf[7] = Number((big >> BigInt(56)) & BigInt(255));
  return buf;
}

export function BuyForm({
  config,
  linkedWallets,
  signedIn = false,
}: {
  config: BuyFormConfig;
  linkedWallets: string[];
  signedIn?: boolean;
}) {
  const { publicKey, connected, signTransaction } = useWallet();
  const connection = useMemo(
    () => new Connection(presaleRpcEndpoint, "confirmed"),
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const programId = useMemo(() => getProgramId(), []);
  const adminWallet = useMemo(() => new PublicKey(presaleConfig.adminWallet), []);

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
  const solNeeded = (tokens * config.tokenPriceUsd) / config.solPriceUsd;

  const handleSend = async () => {
    setError(null);
    if (!connected || !publicKey || !signTransaction) {
      setError("Connect your wallet to buy tokens.");
      return;
    }

    setSending(true);
    try {
      const lamports = Math.round(solNeeded * LAMPORTS_PER_SOL);
      const [configPda] = findConfigPda(adminWallet, programId);
      const [vestingPda] = findVestingPda(configPda, publicKey, programId);
      const [solVaultPda] = findSolVaultPda(configPda, programId);

      const discriminator = await sha256Discriminator("buy_tokens");
      const solBytes = encodeU64(lamports);
      const buyData = new Uint8Array(discriminator.length + solBytes.length);
      buyData.set(discriminator, 0);
      buyData.set(solBytes, discriminator.length);

      const buyIx = new TransactionInstruction({
        programId,
        data: Buffer.from(buyData),
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPda, isSigner: false, isWritable: true },
          { pubkey: vestingPda, isSigner: false, isWritable: true },
          { pubkey: solVaultPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
      });

      const tx = new Transaction().add(buyIx);
      tx.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const signed = await signTransaction!(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      form.setValue("signature", sig);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed.";
      const cancelled =
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("denied") ||
        message.toLowerCase().includes("user rejected");

      if (cancelled) {
        toast.add({
          title: "Transaction cancelled",
          description: "You closed or rejected the request in your wallet.",
          type: "warning",
        });
        return;
      }
      setError(message);
    } finally {
      setSending(false);
    }
  };

  async function onSubmit(values: BuyFormValues) {
    setPending(true);
    setServerError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("signature", values.signature);
    const wallet = publicKey?.toString() ?? linkedWallets[0] ?? "";
    if (wallet) formData.set("wallet", wallet);

    const state = await submitPurchase(undefined, formData);
    setPending(false);

    if (state?.error) {
      setServerError(state.error);
    } else if (state?.message) {
      setSuccess(state.message);
      form.reset();
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
              {solNeeded.toFixed(6)} SOL (≈ {formatUsd(solNeeded * config.solPriceUsd)})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Vesting</span>
            <span className="text-xs">7d cliff, 30d linear vesting</span>
          </div>
        </div>

        {/* {!connected ? (
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
            {sending ? "Sending..." : `Buy with ${solNeeded.toFixed(6)} SOL`}
          </Button>
        )} */}

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
        {success && (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </p>
        )}
      </form>

      <div className="mt-4 border-t pt-4">
        {signedIn ? (
          <>
            <p className="mb-2 text-sm text-muted-foreground">Linked wallets:</p>
            <WalletManager linkedWallets={linkedWallets} />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Create a free account to track your purchase and unlock member tools.
            </p>
            <div className="flex gap-2">
              <Button render={<a href="/register" />} nativeButton={false} className="flex-1">
                Register
              </Button>
              <Button
                render={<a href="/login" />}
                nativeButton={false}
                variant="outline"
                className="flex-1"
              >
                Sign in
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
