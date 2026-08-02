import Link from "next/link";

import { Header } from "@/features/app-shell";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            pin-dex
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Token presale gated app. Register, buy tokens in the presale, and unlock
            the DexScreener-powered dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/presale" />}>Join Presale</Button>
          <Button variant="outline" render={<Link href="/leaderboard" />}>
            Leaderboard
          </Button>
        </div>
      </main>
    </div>
  );
}
