import { redirect } from "next/navigation";

import { Header } from "@/features/app-shell";
import { hasVerifiedPurchase } from "@/features/presale/lib/access";

export default async function AppPage() {
  const hasAccess = await hasVerifiedPurchase();
  if (!hasAccess) redirect("/presale");

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-6 text-sm leading-loose">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          App (coming soon)
        </h1>
        <p>
          You have verified presale access. The DexScreener-powered dashboard will
          land here next.
        </p>
      </main>
    </div>
  );
}
