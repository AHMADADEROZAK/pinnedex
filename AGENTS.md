<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
# PIN-DEX: PINDEX Signal

## Active Plan
The full development plan lives at `docs/PLAN-SIGNAL.md`. Always consult it before making changes.

### Core APIs (DexScreener)
Base URL: `https://api.dexscreener.com`
WebSocket: `wss://api.dexscreener.com`
Full reference: `https://docs.dexscreener.com/api/reference`

### Completed (M1–M10)
- Dynamic wallet-address member path (`/<base58>` → rewrite `/member?w=`) + cookie `member-wallet`
- Subscription model (Mongo), SOL payment via `sendTransaction`, `hasActiveMembership`
- Outbound rate budget: per-endpoint token bucket + global cap (60/min) + reservation (20/min)
- Typed REST client (`features/signal/client/dex.ts`) + TTL cache + `dexfetch()` budget wrapper
- Dashboard `/member`: metas, boosts, CTO feed (Solana-filtered), DataCard metrics
- WebSocket ingestor (4 streams: CTO, profiles, boosts, ads) + `DexEvent` model (TTL 24h)
- Telegram push on ingest events
- Whale Detector + Robinhood Radar (`analyze.ts`)
- SubscribeForm (PinDialog pattern: `useWallet` → `sendTransaction` → server action)

### Completed (Telegram Connect flow)
- 2 mechanisms: **web** (Signals page `/<wallet>/signals`, member-only: Whale+Radar) and **Telegram** (add-on)
- `/<wallet>/member` = Telegram connect page; user inputs phone + pays `TELEGRAM_CONNECT_FEE_SOL` (0.025) → gets private bot link `t.me/<bot>?start=CONNECT_<code>` (15m TTL)
- Bot webhook `POST /api/telegram/update` validates `x-telegram-bot-api-secret-token` (separate `TELEGRAM_WEBHOOK_SECRET`, NOT the bot token — `:` is rejected) → processes `/start CONNECT_<code>` → saves `telegramChatId` on Subscription
- `instrumentation.ts` auto-registers webhook from `TELEGRAM_PUBLIC_URL` at boot; manual: `GET /api/telegram/setup`
- `sendTelegramAlert()` broadcasts CTO/boost/profile to active member chat IDs as a rich HTML photo+caption (token icon, chain, address, amount, claim date, description, links, dex link); `sendTakeoverAlerts()` kept for plain-text broadcasts (webhook verified live @pinnedex_bot)
- Admin "Send test alert" button on `/<ADMIN_PATH>/dex-usage` (TestTelegramAlert + sendTestTelegramAlert action)
- proxy.ts preserves incoming query params (chain/tab) through the `/member` rewrite

### In Progress (P1–P7 UI Expansion)
Porting CTO Hunter (`D:\Data\SPES-TECHNOLOGY\next-factory\cto-hunter`) UI patterns:
- P1: Port 6 components (ItemCard, DataCard, DataTable, ErrorState, CardGridSkeleton, PageSkeleton)
- P3: Pages: boosts (tab pills + chain filter pills, client BoostRow), profiles, takeovers, alerts
- P4: Pages: metas, search
- P5: Detail pages: pairs, tokens
- P7: Typecheck + lint (clean)

### Key Constraints
- No `any` type — always use proper TypeScript types
- No emoji in comments — use JSDoc syntax only
- Telegram VIP chat ID must be stored in DB (Subscription model), NOT in env
- All data content built according to DexScreener API reference
- Focus: Solana network (`chainId === "solana"`) for CTO and analysis
- Monorepo: PIN-DEX is a Next.js 16 project with MongoDB, Solana Web3, tweetnacl

### Target Buyers
Paid subscribers (weekly 0.05 SOL / monthly 0.15 SOL):
- New Launch & Boost Sniper
- Whale Detector
- CTO (Community Token Takeovers) signals

### Feature Gating
| Feature | Access |
|---|---|
| `/member/*` pages (free data: boosts, profiles, metas, search, alerts, takeovers, pairs, tokens) | Free (requires login + wallet path) |
| Signals page `/<wallet>/signals` (Whale Detector + Robinhood Radar) | Paid subscription active |
| Telegram connect `/<wallet>/member` (0.025 SOL add-on) | Paid + subscription |
| Telegram VIP alerts (takeover push to chat ID) | Paid (chat ID in Subscription model) |
<!-- END:project-context -->
<!-- END:nextjs-agent-rules -->
