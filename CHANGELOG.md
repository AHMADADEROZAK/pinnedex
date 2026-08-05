# Changelog

Semua perubahan penting pada Pinnedex (pin-dex) dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Direncanakan
- Pembayaran pin Community memakai token **PINE** (toggle SOL/PINE) —
  lihat `docs/PLAN-PINE-PAYMENT.md`.

---

## 2026-08-06

### Added
- **PINDEX Signal** — dashboard anggota di path wallet `/<wallet>/*` (rewrite
  ke `/member/*`):
  - Halaman: Dashboard, Boosts (Latest/Top + filter chain), Profiles,
    Takeovers, Metas, Search, Alerts (filter type + chain + legend icon),
    Pairs & Tokens detail.
  - **Whale Detector & Robinhood Radar** (member-only) di `/<wallet>/signals`;
    halaman gratis menampilkan upsell SubscribeForm.
- **Subscriptions** (MongoDB): langganan mingguan 0.05 SOL / bulanan
  0.15 SOL, bayar via `sendTransaction` + verifikasi on-chain.
- **DexScreener data pipeline**:
  - Typed REST client + TTL cache + budget rate-limiter (per-endpoint &
    global cap, reservasi ingestor).
  - **WebSocket ingestor** (4 stream: CTO, profiles, boosts, ads) → `DexEvent`
    model (TTL 24 jam) + dashboard admin `dex-usage`.
- **Telegram alerts**:
  - Bot `@pinnedex_bot`, webhook `POST /api/telegram/update` dengan
    `x-telegram-bot-api-secret-token` (`TELEGRAM_WEBHOOK_SECRET`).
  - Connect flow: telepon + bayar 0.025 SOL → link privat `t.me/<bot>?start=CONNECT_<code>`
    (TTL 15 menit) → `/start` menyimpan `telegramChatId`.
  - Alert dikirim sebagai **HTML foto+caption data lengkap** (icon token,
    chain, address, amount, claim date, description, links, link dex).
  - Admin "Send test alert" di `/<ADMIN_PATH>/dex-usage`.
- **WorldPhoneCode**: combobox kode negara + nomor telepon (242 negara dari
  gist, tersimpan di MongoDB).
- **Brand link buttons**: DexScreener (dex.png), X, Telegram, TikTok, Reddit,
  Instagram — `icon-xs` ghost buttons; fallback `LinkIcon` untuk link lain.
- **Halaman Features** (`/features`): daftar fitur aplikasi + menu header
  "Features".

### Changed
- **Dark theme saja**: `forcedTheme="dark"`, hotkey + toggle tema
  dihapus/dinonaktifkan (tidak bisa ganti system/light).
- **Header**: menu "Signal" tampil bila wallet sudah ter-link; perbaikan
  duplicate-key.
- `proxy.ts`: rewrite `/member` mempertahankan query params (chain/tab) dan
  set cookie `member-wallet`.
- Icon type pada tabel Alerts: Profile kini `FilePen`, legend ikon
  (Rocket=Boost, Handshake=Takeover, dll).

### Fixed
- Serialisasi `DexEvent` → props client (hanya plain object).
- `Button` base-ui: `nativeButton=false` saat render `<a>`.

---

## 2026-08-05

### Added
- **Community** (feed paid pin):
  - Posting "pin" berbayar **0.00025 SOL** ke collection wallet,
    verifikasi on-chain di server.
  - Upload gambar ke **Minio S3** (presigned URL).
  - Like, komentar, dan **emoji picker** (~1859 emoji dari MongoDB).
  - `PinDialog`, `PostCard`, `PostFeed`, `CommentDialog`, `EmojiDialog`,
    `ImageUpload`, `CommunitySearch` (filter live by konten/nama/email).
  - **Sidebar**: "New pins" (kiri), "Popular pins" (kanan, top 5),
    layout grid proporsional `5fr / 11fr / 4fr`.
- **Preview mode publik**: `/community` & `/community/[postId]` bisa dilihat
  tanpa login. Create pin, like, dan comment dinonaktifkan untuk guest
  (tombol disabled + CTA "Sign in / create an account").
- **Panduan Komunitas** (`/community/guidelines`): asas tukar pikiran,
  larangan rasisme, isu agama, ajakan kebencian, scam/penipuan kripto,
  dan kejahatan siber. Pelanggaran dihapus otomatis oleh sistem.
- **Admin dashboard**:
  - Modul **Community Pins** (`/admin/pins`): daftar pin + hapus pin
    (menghapus komentar & file gambar terkait).
  - Sidebar admin: grup **Public** → tombol ke `/community`.
  - Statistik angka: Users, Purchases, Tokens, SOL, Pins, Comments, Likes,
    Banned IPs.
  - List top 10: **Leaderboard** (pins + comments + likes), **New pins**,
    **Top pins**.

### Changed
- **Header**: tab Community kini selalu tampil (termasuk saat belum login);
  tab Profile tetap disembunyikan untuk guest.
- **PresaleCountdown**: perbaikan **hydration mismatch** — render placeholder
  `--` sampai ter-mount, lalu tick via interval (tanpa `Date.now()` di render,
  juga lolos lint purity).

### Security / Hardening
- API routes diberi proteksi:
  - `/api/security/bans` → **khusus admin** (403 untuk non-admin).
  - `/api/rpc`, `/api/comments`, `/api/emojis`, `/api/rates` → rate-limit.
- Auto-ban IP pada deteksi brute-force (melebihi limit request/menit) —
  sudah aktif di `checkRateLimit`.
- `toggleLike` kini juga rate-limited.
- `/community` dilepas dari `protectedRoutes` (menjadi publik).

### Fixed
- Hydration mismatch pada countdown presale.
- `Button` + `Link` (nativeButton=false) untuk action row dan tombol admin.

---

## 2026-08-04 (sebelumnya)

### Added
- Foundation: Next.js 16 App Router, TypeScript, MongoDB/Mongoose,
  Solana web3.js, Tailwind 4, base-vega UI (`@base-ui/react`).
- Auth: JWE session, double-sha256 password hashing, role admin,
  per-route rate limits.
- Admin dashboard dengan secret path, manajemen ban, rate limits terukur.
- Presale dapp: countdown, explorer links, wallet link.
