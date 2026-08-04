"use client";

import { useEffect, useState } from "react";

export function PresaleCountdown({ end }: { end: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = end.getTime() - now;

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

  if (diff <= 0) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        Presale ended.
      </p>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex items-center gap-3">
      <CountdownUnit value={days} label="Days" />
      <span className="text-lg text-muted-foreground">:</span>
      <CountdownUnit value={pad(hours)} label="Hours" />
      <span className="text-lg text-muted-foreground">:</span>
      <CountdownUnit value={pad(minutes)} label="Min" />
      <span className="text-lg text-muted-foreground">:</span>
      <CountdownUnit value={pad(seconds)} label="Sec" />
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex min-w-14 flex-col items-center rounded-md border bg-card px-2 py-1.5">
      <span className="font-mono text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
