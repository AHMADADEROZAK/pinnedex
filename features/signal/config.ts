const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export type MemberPlan = "weekly" | "monthly";

export const signalConfig = {
  get collectionWallet() {
    return process.env.NEXT_PUBLIC_PRESALE_COLLECTION_WALLET ?? "";
  },
  get weeklyFeeSol() {
    return num(process.env.MEMBER_WEEKLY_FEE_SOL, 0.05);
  },
  get monthlyFeeSol() {
    return num(process.env.MEMBER_MONTHLY_FEE_SOL, 0.15);
  },
  get telegramConnectFeeSol() {
    return num(process.env.TELEGRAM_CONNECT_FEE_SOL, 0.025);
  },
  get telegramBotUsername() {
    return process.env.TELEGRAM_BOT_USERNAME ?? "";
  },
  get telegramWebhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  },
};

export function memberFeeSol(plan: MemberPlan) {
  return plan === "weekly"
    ? signalConfig.weeklyFeeSol
    : signalConfig.monthlyFeeSol;
}

export function memberFeeLamports(plan: MemberPlan) {
  return Math.round(memberFeeSol(plan) * 1e9);
}