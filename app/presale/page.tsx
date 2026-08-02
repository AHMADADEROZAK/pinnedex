import { redirect } from "next/navigation";

import { Header } from "@/features/app-shell";
import {
  BuyForm,
  PresaleCountdown,
  isPresaleActive,
  presaleConfig,
  getPresaleUsdPrices,
} from "@/features/presale";
import { getSessionUser } from "@/lib/dal";

export default async function PresalePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const active = isPresaleActive();
  const { tokenPriceUsd, solPriceUsd } = await getPresaleUsdPrices();

  const config = {
    collectionWallet: presaleConfig.collectionWallet,
    tokenPriceUsd,
    solPriceUsd,
    minTokens: presaleConfig.minTokens,
    maxTokens: presaleConfig.maxTokens,
  };

  const endsAt = presaleConfig.end;

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Presale</h1>
          <p className="text-sm text-muted-foreground">
            {active
              ? "Buy tokens at the presale price before the app launches."
              : "The presale is not open yet."}
          </p>
        </div>

        {endsAt && (
          <div className="flex flex-col gap-2 rounded-md border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Presale ends on{" "}
              {endsAt.toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <PresaleCountdown end={endsAt} />
          </div>
        )}

        {active ? (
          <BuyForm config={config} linkedWallets={user.wallets.map((w) => w.address)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Presale opens{" "}
            {presaleConfig.start
              ? new Date(presaleConfig.start).toLocaleString()
              : "soon"}
            .
          </p>
        )}
      </main>
    </div>
  );
}
