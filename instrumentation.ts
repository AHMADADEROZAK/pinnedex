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

    const DAY_MS = 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      refreshUsdIdrRate().catch(() => {});
    }, DAY_MS);

    timer.unref?.();
  }
}
