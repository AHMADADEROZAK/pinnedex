import {
  Activity,
  CandlestickChart,
  Coins,
  Compass,
  Gift,
  Newspaper,
  PartyPopper,
  Rocket,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export const navIcons = {
  features: Compass,
  news: Newspaper,
  community: Users,
  presale: Rocket,
  claim: Coins,
  leaderboard: Trophy,
  "party-room": PartyPopper,
  "chart-candlestick": CandlestickChart,
  signal: Activity,
  profile: UserRound,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof navIcons;