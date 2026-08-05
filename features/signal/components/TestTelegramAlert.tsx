"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendTestTelegramAlert } from "@/features/signal/actions/signal";

export function TestTelegramAlert() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onSend = async () => {
    setPending(true);
    setResult(null);
    try {
      const res = await sendTestTelegramAlert();
      setResult(
        res.ok
          ? `Sent to ${res.sent}/${res.targeted} connected member(s).`
          : res.message ?? "Failed.",
      );
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={pending}
          onClick={onSend}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send test alert
        </Button>
      </div>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}