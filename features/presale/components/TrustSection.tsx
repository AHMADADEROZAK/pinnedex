import { Clock } from "lucide-react";
import { presaleConfig, isPresaleActive } from "@/features/presale/config";

export async function TrustSection() {
  const active = isPresaleActive();
  const end = presaleConfig.end;

  const { getPresaleUsdPrices } = await import("@/features/presale/server/prices");
  const { tokenPriceUsd, solPriceUsd } = await getPresaleUsdPrices();

  return (
    <section className="flex flex-col gap-2 rounded-md border bg-card p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Status</span>
        <span className={active ? "font-medium text-emerald-500" : "font-medium text-muted-foreground"}>
          {active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Token price</span>
        <span className="font-medium tabular-nums">${tokenPriceUsd.toFixed(6)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">1 SOL</span>
        <span className="font-medium tabular-nums">${solPriceUsd.toFixed(2)}</span>
      </div>
      {active && end && (
        <div className="flex items-center gap-1 border-t pt-2 text-muted-foreground">
          <Clock className="size-3" />
          <span>
            Ends{" "}
            {end.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </section>
  );
}
