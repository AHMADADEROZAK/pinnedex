import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { WalletBalance } from "@/features/wallet/components/WalletBalance";
import { verifySession } from "@/lib/dal";
import { hasActiveMembership, Subscription } from "@/features/signal";
import { connectToDatabase } from "@/lib/mongodb";
import { MemberSidebar } from "@/features/signal/components/MemberSidebar";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();

  const wallet = (await cookies()).get("member-wallet")?.value ?? "";

  if (!wallet) redirect("/presale");

  const isMember = await hasActiveMembership();
  let memberExpiresAt: string | null = null;
  if (isMember) {
    try {
      await connectToDatabase();
      const sub = await Subscription.findOne({
        status: "active",
        expiresAt: { $gt: new Date() },
      })
        .sort({ expiresAt: -1 })
        .lean()
        .exec();
      if (sub) memberExpiresAt = sub.expiresAt.toISOString();
    } catch {
      // ignore
    }
  }

  return (
    <SidebarProvider>
      <MemberSidebar
        wallet={wallet}
        isMember={isMember}
        memberExpiresAt={memberExpiresAt}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <WalletBalance />
            <ConnectWallet />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}