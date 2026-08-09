export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { refreshUsdIdrRate } = await import("@/features/rates/exchangeRate");
    const { createBucketIfNotExists } = await import("@/lib/minio-client");
    const { syncEmojis } = await import("@/features/community/server/emoji-sync");
    const { syncCountryCodes } = await import(
      "@/features/signal/server/country-code-sync"
    );

    refreshUsdIdrRate().catch(() => {});
    createBucketIfNotExists().catch(() => {});
    syncEmojis().catch(() => {});
    syncCountryCodes().catch(() => {});

    const { startDexIngestion } = await import("@/features/signal/ingest");
    startDexIngestion();

    const { setTelegramWebhook } = await import(
      "@/features/signal/server/telegram"
    );
    const publicUrl = process.env.TELEGRAM_PUBLIC_URL?.trim();
    if (publicUrl) {
      setTelegramWebhook(`${publicUrl.replace(/\/$/, "")}/api/telegram/update`).catch(
        () => {},
      );
    }

    const { setPartyWebhook } = await import("@/features/chat/server/telegram");
    if (process.env.TELEGRAM_PARTY_BOT_TOKEN?.trim() && publicUrl) {
      setPartyWebhook(`${publicUrl.replace(/\/$/, "")}/api/telegram/party/update`).catch(
        () => {},
      );
    }

    const { deleteStaleChallenges } = await import("@/features/chat/server/db");
    const STALE_MS = Number(process.env.CHALLENGE_STALE_MS ?? 10 * 60_000);
    const cleanupInterval = Number(
      process.env.CHALLENGE_CLEANUP_INTERVAL_MS ?? 30_000,
    );
    const cleanupChallenges = async () => {
      try {
        const deleted = await deleteStaleChallenges(STALE_MS);
        if (deleted > 0) {
          console.log(`[cleanup] removed ${deleted} stale challenge(s)`);
        }
      } catch (err) {
        console.error("[cleanup] failed to remove stale challenges", err);
      }
    };
    cleanupChallenges().catch(() => {});
    const challengeTimer = setInterval(cleanupChallenges, cleanupInterval);
    challengeTimer.unref?.();

    const DAY_MS = 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      refreshUsdIdrRate().catch(() => {});
    }, DAY_MS);

    timer.unref?.();
  }
}
