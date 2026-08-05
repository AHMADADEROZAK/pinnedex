"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Crown, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { subscribeMember } from "@/features/signal/actions/signal";
import type { FormState } from "@/lib/definitions";

const PLANS = ["weekly", "monthly"] as const;

const formSchema = z.object({
  plan: z.enum(["weekly", "monthly"]),
  walletAddress: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid wallet address."),
});

type FormValues = z.infer<typeof formSchema>;

interface SubscribeFormProps {
  linkedWallets: string[];
  feeWeeklySol: number;
  feeMonthlySol: number;
  collectionWallet: string;
}

export function SubscribeForm({
  linkedWallets,
  feeWeeklySol,
  feeMonthlySol,
  collectionWallet,
}: SubscribeFormProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const feeMap: Record<string, number> = {
    weekly: feeWeeklySol,
    monthly: feeMonthlySol,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan: "weekly",
      walletAddress: linkedWallets[0] ?? "",
    },
  });

  const plan = form.watch("plan");
  const feeSol = feeMap[plan];
  const lamports = Math.round(feeSol * LAMPORTS_PER_SOL);

  const onSubmit = async (values: FormValues) => {
    setPending(true);
    setServerError(null);

    if (!collectionWallet) {
      setPending(false);
      setServerError("Collection wallet not configured.");
      return;
    }

    if (!connected || !publicKey || !sendTransaction) {
      setPending(false);
      return;
    }

    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(collectionWallet),
          lamports,
        }),
      );
      const sig = await sendTransaction(tx, connection);

      const fd = new FormData();
      fd.set("plan", values.plan);
      fd.set("walletAddress", values.walletAddress);
      fd.set("signature", sig);

      const state: FormState = await subscribeMember(undefined, fd);
      handleState(state);
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
      }
      setPending(false);
    }
  };

  function handleState(state: FormState) {
    if (state?.errors) {
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          if (key === "plan" || key === "walletAddress") {
            form.setError(key, { message: messages[0] });
          } else {
            setServerError(messages[0]);
          }
        }
      }
      setPending(false);
      return;
    }
    if (state?.message) {
      setServerError(state.message);
      setPending(false);
      return;
    }

    toast.add({
      title: "Subscription active",
      description: `Your ${form.getValues("plan")} membership is now active.`,
      type: "success",
    });
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Plan</label>
          <div className="flex gap-3">
            {PLANS.map((p) => (
              <label
                key={p}
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  type="radio"
                  value={p}
                  {...form.register("plan")}
                  className="accent-primary"
                />
                <span>
                  {p.charAt(0).toUpperCase() + p.slice(1)} — {feeMap[p]} SOL
                </span>
              </label>
            ))}
          </div>
          {form.formState.errors.plan && (
            <FieldError errors={[form.formState.errors.plan]} />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Wallet</label>
          {linkedWallets.length > 0 ? (
            <select
              {...form.register("walletAddress")}
              className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
            >
              {linkedWallets.map((w) => (
                <option key={w} value={w}>
                  {w.slice(0, 8)}...{w.slice(-4)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No linked wallets. Link one first from Profile.
            </p>
          )}
          {form.formState.errors.walletAddress && (
            <FieldError errors={[form.formState.errors.walletAddress]} />
          )}
        </div>
      </div>

      {/* Footer */}
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

        {!connected ? (
          <ConnectWallet />
        ) : (
          <Button
            type="submit"
            disabled={pending || !form.formState.isValid}
            size="sm"
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crown className="size-4" />
            )}
            {pending ? "Subscribing…" : "Subscribe"}
          </Button>
        )}
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}
    </form>
  );
}