# Changelog

Semua perubahan penting pada Pinnedex (pin-dex) dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/).
Versi mengikuti [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Direncanakan
- Pembayaran pin Community memakai token **PINE** (toggle SOL/PINE) —
  lihat `docs/PLAN-PINE-PAYMENT.md`.

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
