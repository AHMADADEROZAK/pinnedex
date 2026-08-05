# PLAN: PINDEX Signal (v2 — UI Expansion)

## Status: M1–M10 Core ✅ | UI Expansion (P1–P7) 🔜

---

## ✅ Sudah Terbangun (M1–M10 Core)

| Milestone | Status | Deskripsi |
|---|---|---|
| M1 | ✅ | Proxy dynamic wallet-address path (`/<base58>`) + rewrite internal `/app/member?w=` |
| M2 | ✅ | `Subscription` model (Mongo) + SOL payment via `sendTransaction` + `hasActiveMembership` |
| M3 | ✅ | `features/signal/ratelimit/` — per-endpoint token bucket + global cap + reservation + queue |
| M4 | ✅ | `features/signal/client/` — typed REST client + TTL `cache.ts` + `dexfetch()` budget wrapper |
| M5 | ✅ | Dashboard free `/app` — Trending Metas, Top Boosts, CTO Feed (Solana) |
| M6 | ✅ | WebSocket ingestor (4 streams: CTO, profiles, boosts, ads) + `DexEvent` model (TTL 24h) + `/admin/dex-usage` |
| M7 | ✅ | Alert engine — Telegram push on CTO/boost/profile via WS ingest (`sendTelegram`) |
| M8 | ✅ | Whale Detector + Robinhood Radar (`features/signal/lib/analyze.ts`) |
| M9 | ✅ | Member UI — `SubscribeForm` (PinDialog pattern: `useWallet` → `sendTransaction` → server action) + `MemberGate` |
| M10 | ✅ | Typecheck passes, lint passes (pre-existing community warnings only) |

---

## 🔜 P1–P7: UI Expansion (CTO Hunter Style)

Basis pengembangan: `https://docs.dexscreener.com/api/reference`

### Arsitektur File (ditambahkan)

```
features/signal/
└── components/
    ├── ItemCard.tsx              # P1 — port dari CTO Hunter
    ├── DataCard.tsx              # P1 — port
    ├── DataTable.tsx             # P1 — port (generic table)
    ├── ErrorState.tsx            # P1 — port
    ├── LoadingSkeleton.tsx       # P1 — port
    ├── SignalSidebar.tsx         # P2 — sidebar nav
    ├── SubscribeForm.tsx         # ✅ M9
    └── MemberGate.tsx            # ✅ M9

app/app/
├── layout.tsx                    # P2 — signal sub-layout + sidebar
├── page.tsx                      # ✅ M5 / P6 — dashboard
├── member/page.tsx               # ✅ M9 — member dashboard
├── boosts/page.tsx               # P3a
├── profiles/page.tsx             # P3b
├── takeovers/page.tsx            # P3c
├── alerts/page.tsx               # P3d
├── metas/page.tsx                # P4a
├── ads/page.tsx                  # P4b
├── search/page.tsx               # P4c
├── pairs/[chainId]/[pairId]/page.tsx  # P5a
└── tokens/[chainId]/[tokenAddress]/page.tsx  # P5b
```

### Komponen Port dari CTO Hunter (P1)

| Komponen | Sumber | Tipe | Fungsi |
|---|---|---|---|
| `ItemCard` | `item-card.tsx` | Client | Card token profile/CTO/boost — icon, header image, chain badge, deskripsi, social links, copy address button |
| `DataCard` | `data-card.tsx` | Client | Metric card — icon, title, value, deskripsi |
| `DataTable` | `data-table.tsx` | Client | Generic table — columns, data, loading/error/empty states |
| `ErrorState` | `error-state.tsx` | Client | Error display + optional retry callback |
| `CardGridSkeleton` | `loading-skeleton.tsx` | Client | Grid skeleton placeholder (jumlah cards configurable) |
| `PageSkeleton` | `loading-skeleton.tsx` | Client | Full page skeleton (header + cards placeholder) |

Pola: file tunggal `LoadingSkeleton.tsx` berisi `CardGridSkeleton` + `PageSkeleton`.

### Layout dengan Sidebar (P2)

`app/app/layout.tsx` — sub-layout signal, hanya untuk `/app/*`:

```text
┌──────────────────────────────────────────────────────┐
│  HEADER PIN-DEX (Community|Presale|Leaderboard|Signal|Profile)  │
├──────────┬───────────────────────────────────────────┤
│ SIDEBAR  │  CONTENT (children)                       │
│          │                                           │
│ Dashboard│                                           │
│ Boosts   │                                           │
│ Profiles │                                           │
│ Takeovers│                                           │
│ Metas    │                                           │
│ Ads      │                                           │
│ Search   │                                           │
│ Alerts   │                                           │
│ ─────── │                                           │
│ Member ↗ │                                           │
└──────────┴───────────────────────────────────────────┘
```

Item "Member →" link ke `/<firstLinkedWallet>` — ambil dari session user.

### Fase P3: Halaman Data

#### P3a — `/app/boosts`
- Tab: "Latest" + "Top"
- Latest: `getLatestBoosts()` → filter Solana → `ItemCard` grid
- Top: `getTopBoosts()` → filter Solana → `ItemCard` grid
- Loading: `CardGridSkeleton`
- Error: `ErrorState` + retry

#### P3b — `/app/profiles`
- Tab: "Latest" + "Recent Updates"
- Latest: `getLatestTokenProfiles()` → filter Solana → `ItemCard` grid
- Updates: `getRecentTokenProfileUpdates()` → filter Solana → `ItemCard` grid
- Loading: `CardGridSkeleton`
- Error: `ErrorState` + retry

#### P3c — `/app/takeovers`
- List: `getLatestCommunityTakeovers()` → filter Solana → `ItemCard` grid
- Setiap card tampilkan `claimDate`
- Loading: `CardGridSkeleton`
- Error: `ErrorState` + retry

#### P3d — `/app/alerts`
- Baca `DexEvent` dari MongoDB — query: type, chainId, tokenAddress, seenAt
- Free: summary 50 terbaru
- Member: full feed + filter (type, chainId)
- Render: `DataTable` dengan kolom type (badge), chainId, tokenAddress, seenAt
- Loading: `PageSkeleton`
- Error: `ErrorState`

### Fase P4: Halaman Tambahan

#### P4a — `/app/metas`
- List trending: `getTrendingMetas()` → `DataCard` grid (marketCap, volume, liq, % change)
- Slug lookup: input → `getMetaBySlug(slug)` → detail panel + list pairs
- Loading: `CardGridSkeleton`
- Error: `ErrorState` + retry

#### P4b — `/app/ads`
- List: `getLatestAds()` → `DataTable` (kolom: chainId, tokenAddress, type, duration, impressions, date)
- Loading: `PageSkeleton`
- Error: `ErrorState`

#### P4c — `/app/search`
- SearchBar (input + button, client)
- Results: `searchPairs(q)` → `DataTable` (kolom: pair, DEX, price, volume 24h, price change) → klik → `/app/pairs/...`
- Loading: `PageSkeleton`
- Error: `ErrorState` + retry
- Empty: "No results found for ..."

### Fase P5: Halaman Detail

#### P5a — `/app/pairs/[chainId]/[pairId]`
- Detail pair: `getPair(chainId, pairId)`
- Panel: baseToken/quoteToken, price (USD + native), priceChange (m5/h1/h6/h24), volume (m5/h1/h6/h24), txns (buys/sells), liq, FDV, marketCap, pairCreatedAt, info (socials, websites), boosts active
- Loading: `PageSkeleton`
- Error: `ErrorState` + retry

#### P5b — `/app/tokens/[chainId]/[tokenAddress]`
- List pairs: `getTokenPairs(chainId, tokenAddress)`
- Render: `DataTable` (kolom: DEX, pairAddress, price, volume, liq) → klik ke pair detail
- Loading: `PageSkeleton`
- Error: `ErrorState` + retry

### Fase P6: Upgrade Dashboard `/app`

- Section atas: **DataCard** row — total CTOs, boosts aktif, profiles tracked, alert count (24h dari `DexEvent`)
- Section tengah: Tetap Trending Metas + Top Boosts + CTO Feed (pakai `ItemCard`)
- Section bawah: Upsell member card

### Fase P7: Polish

- Typecheck seluruh project
- Lint seluruh project
- Update README.md

---

## 📱 Telegram

### Fase A: Public Channel (✅ sudah jalan)
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` dari env
- Ingestor auto-kirim: `[CTO]`, `[BOOST]`, `[PROFILE]`
- Free, untuk brand awareness

### Fase B: VIP Channel (setelah P1-P7)
- **`telegramChatId` disimpan di `Subscription` model** (bukan env)
- Saat subscribe, user input Telegram chat ID (via bot `/start` → dapat ID)
- Atau: bot generate invite link ke VIP channel, kirim via DM
- Ingestor filter: hanya kirim ke VIP channel kalau ada minimal 1 member aktif
- Monetisasi: hanya member bisa akses VIP channel

### Fase C: Bot DM Personal (future)
- User `/start` bot → simpan `telegramChatId` di model `User` (bukan Subscription)
- Alert difilter per preferensi user (`AlertPref` model)
- Butuh Telegram Bot Webhook + flow link akun

---

## Fitur Free vs Member

| Fitur | Free (`/app/*`) | Member (`/<wallet>`) |
|---|---|---|
| Dashboard overview | ✅ | ✅ |
| Trending Metas | ✅ | ✅ |
| Token Boosts (latest + top) | ✅ | ✅ filter + detail |
| Token Profiles (latest + updates) | ✅ | ✅ filter + detail |
| Community Takeovers (Solana) | ✅ | ✅ + real-time + countdown |
| Ads | ✅ | ✅ |
| Search Pairs | ✅ | ✅ |
| Pair Detail | ✅ | ✅ |
| Token Detail | ✅ | ✅ |
| Alert History | Summary (50) | Full + filter |
| Whale Detector | ❌ | ✅ |
| Robinhood Radar | ❌ | ✅ |
| Telegram VIP Channel | ❌ | ✅ |
| Telegram Public Alert | ✅ | ✅ |

---

## Env Vars (tambahan)

```env
# Telegram VIP (Fase B, nanti — chat ID disimpan di DB, bukan env)
```

---

## Pengecekan Implementasi

- [ ] P1: Port 6 komponen CTO Hunter → `features/signal/components/`
- [ ] P2: `app/app/layout.tsx` + `SignalSidebar`
- [ ] P3a: `/app/boosts` — tab Latest + Top, ItemCard grid
- [ ] P3b: `/app/profiles` — tab Latest + Updates, ItemCard grid
- [ ] P3c: `/app/takeovers` — ItemCard grid + claimDate
- [ ] P3d: `/app/alerts` — DataTable dari DexEvent
- [ ] P4a: `/app/metas` — DataCard grid + slug lookup
- [ ] P4b: `/app/ads` — DataTable
- [ ] P4c: `/app/search` — SearchBar + DataTable results
- [ ] P5a: `/app/pairs/[chainId]/[pairId]` — panel detail
- [ ] P5b: `/app/tokens/[chainId]/[tokenAddress]` — DataTable pairs
- [ ] P6: Dashboard `/app` — DataCard metrics row
- [ ] P7: Typecheck + lint