export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { refreshUsdIdrRate } = await import("@/features/rates/exchangeRate");

    refreshUsdIdrRate().catch(() => {});

    const DAY_MS = 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      refreshUsdIdrRate().catch(() => {});
    }, DAY_MS);

    timer.unref?.();
  }
}
