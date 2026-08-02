"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldBan, Trash2, Plus } from "lucide-react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Ban = { ip: string; reason: string; createdAt: string };

const banSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(1, "IP address is required."),
  reason: z.string().trim().optional(),
});

type BanValues = z.infer<typeof banSchema>;

export default function AdminBansPage() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<Ban | null>(null);
  const [unbanBusy, setUnbanBusy] = useState(false);

  const form = useForm<BanValues>({
    resolver: zodResolver(banSchema),
    defaultValues: { ip: "", reason: "" },
  });

  useEffect(() => {
    fetch("/api/security/bans")
      .then((r) => r.json())
      .then((d) => setBans(d.banned ?? []))
      .catch(() => setError("Failed to load bans"))
      .finally(() => setLoading(false));
  }, []);

  async function addBan(values: BanValues) {
    if (adding) return;
    setAdding(true);
    setError(null);
    const res = await fetch("/api/security/bans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ip: values.ip,
        reason: values.reason || undefined,
      }),
    });
    setAdding(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to add ban");
      return;
    }
    setBans((prev) => [
      {
        ip: values.ip,
        reason: values.reason || "Manually banned",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    form.reset({ ip: "", reason: "" });
  }

  const removeBan = async () => {
    if (!unbanTarget || unbanBusy) return;
    setUnbanBusy(true);
    setError(null);
    const res = await fetch(
      `/api/security/bans?ip=${encodeURIComponent(unbanTarget.ip)}`,
      { method: "DELETE" },
    );
    setUnbanBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to remove ban");
      return;
    }
    setBans((prev) => prev.filter((b) => b.ip !== unbanTarget.ip));
    setUnbanTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <ShieldBan className="size-6 text-primary" />
        Banned IPs
      </h1>

      <form
        onSubmit={form.handleSubmit(addBan)}
        className="rounded-md border bg-card p-4 text-card-foreground"
      >
        <div className="flex flex-col gap-4">
          <Controller
            name="ip"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="flex-1" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ban-ip">IP address</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    id="ban-ip"
                    placeholder="127.0.0.1"
                    aria-invalid={fieldState.invalid}
                    disabled={adding}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            name="reason"
            control={form.control}
            render={({ field }) => (
              <Field className="flex-1">
                <FieldLabel htmlFor="ban-reason">
                  Reason (optional)
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    {...field}
                    id="ban-reason"
                    placeholder="Spam / abuse"
                    rows={3}
                    disabled={adding}
                  />
                </FieldContent>
              </Field>
            )}
          />
          <Button type="submit" disabled={adding} className="self-start">
            {adding ? <Loader2 className="animate-spin" /> : <Plus />}
            Ban
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">IP</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Banned at</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : bans.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-muted-foreground">
                  No banned IPs.
                </td>
              </tr>
            ) : (
              bans.map((b) => (
                <tr key={b.ip} className="border-b last:border-0">
                  <td className="p-3 font-mono">{b.ip}</td>
                  <td className="p-3 text-muted-foreground">{b.reason}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnbanTarget(b)}
                    >
                      <Trash2 />
                      Unban
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={unbanTarget !== null}
        onOpenChange={(open) => {
          if (!open && !unbanBusy) setUnbanTarget(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Unban IP?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the ban for{" "}
              <span className="font-mono">{unbanTarget?.ip}</span>? The IP will be
              allowed to use the app again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnbanTarget(null)}
              disabled={unbanBusy}
            >
              Cancel
            </Button>
            <AlertDialogAction onClick={removeBan} disabled={unbanBusy}>
              {unbanBusy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Unban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
