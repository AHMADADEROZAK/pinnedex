import { cookies } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import { verifySession } from "@/lib/dal";
import {
  hasActiveMembership,
  signalConfig,
  Subscription,
} from "@/features/signal";
import { TelegramConnect } from "@/features/signal/components/TelegramConnect";
import { SubscribeForm } from "@/features/signal/components/SubscribeForm";

export default async function TelegramPage() {
  const session = await verifySession();
  const isMember = await hasActiveMembership();

  if (!isMember) {
    const wallet = (await cookies()).get("member-wallet")?.value ?? "";

    return (
      <div className="flex flex-col gap-6 text-sm leading-loose">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Telegram
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect Telegram to receive real-time CTO takeover alerts.
        </p>
        <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-2 font-heading text-lg font-semibold">
            Subscribe to Unlock
          </h2>
          <p className="mb-4 text-muted-foreground">
            Activate a membership first, then connect Telegram as an add-on.
          </p>
          <SubscribeForm
            linkedWallets={wallet ? [wallet] : []}
            feeWeeklySol={signalConfig.weeklyFeeSol}
            feeMonthlySol={signalConfig.monthlyFeeSol}
            collectionWallet={signalConfig.collectionWallet}
          />
        </div>
      </div>
    );
  }

  let status: "none" | "pending" | "connected" = "none";
  let linkCode: string | undefined;

  try {
    await connectToDatabase();
    const sub = await Subscription.findOne({
      userId: session.userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .sort({ expiresAt: -1 })
      .lean()
      .exec();

    if (sub) {
      if (sub.telegramStatus === "connected" && sub.telegramChatId) {
        status = "connected";
      } else if (
        sub.telegramStatus === "pending" &&
        sub.telegramLinkCode &&
        sub.telegramLinkExpiresAt &&
        sub.telegramLinkExpiresAt.getTime() > Date.now()
      ) {
        status = "pending";
        linkCode = sub.telegramLinkCode;
      }
    }
  } catch {
    // ignore
  }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Telegram
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect Telegram to receive real-time CTO takeover alerts.
        </p>
      </div>
      <TelegramConnect
        isMember={isMember}
        status={status}
        botUsername={signalConfig.telegramBotUsername}
        feeSol={signalConfig.telegramConnectFeeSol}
        collectionWallet={signalConfig.collectionWallet}
        linkCode={linkCode}
      />
    </div>
  );
}
