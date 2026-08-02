# Plan: Admin Management + Airdrop

Fitur berikutnya setelah security/rate limit. Bertujuan memberi admin kemampuan mengelola presale dan mengirim token PIN ke buyer via airdrop.

## Tujuan

1. Halaman admin (`/admin`) yang hanya bisa diakses role admin.
2. Admin melihat semua user, purchase, wallet, dan status airdrop.
3. Admin mengelola airdrop: lihat list wallet yang berhak dapat token, jalankan airdrop (manual + mass), catat status hasil (success/failed), dan mekanisme retry.
4. Security: role check di sisi server (tidak hanya UI), proteksi route admin.

---

## Milestone 1 — Role & Auth Admin

- Tambah field `role: "admin" | "user"` di model `User` (default `user`).
- Helper `requireAdmin()` di `lib/dal.ts` — throw/redirect kalau session bukan admin. Dipakai di server actions & halaman admin.
- `proxy.ts` (middleware): proteksi `/admin/*` — redirect ke `/login` kalau tidak login, dan ke `/` kalau bukan admin (sebagai lapisan pertama; cek final tetap di server).
- Seeder: script atau action untuk menandai user pertama sebagai admin (misal via `ADMIN_EMAIL` env atau CLI one-off).
- Layout khusus `/admin` (sidebar/nav untuk section).

**Acceptance:**
- [ ] User non-admin yang akses `/admin` di-redirect.
- [ ] Server action admin tanpa `requireAdmin()` gagal.
- [ ] User pertama bisa dijadikan admin via env/script.

---

## Milestone 2 — Model Airdrop & Data

Data yang dibutuhkan admin untuk mengelola airdrop:

- `features/airdrop/models/Airdrop.ts` — collection `airdrops`:
  - `txId`, `purchaseId`, `userId`, `walletAddress`, `tokenAmount`, `status: pending|processing|success|failed`, `error`, `retries`, `processedAt`
- Tambahkan di `Purchase` model: index unik `walletAddress` (1 tx per wallet untuk airdrop) kalau belum ada; field status airdrop opsional.
- Halaman admin `/admin/airdrop`:
  - List wallet yang **eligible** = purchase terverifikasi yang belum pernah di-airdrop.
  - Token amount per wallet (recompute dari `tokenAmount` yang tersimpan).
  - Filter: status airdrop, rentang tanggal, search wallet/user.

**Acceptance:**
- [ ] Model Airdrop terbuat & migrasi aman.
- [ ] Halaman admin menampilkan eligible wallets dengan jumlah token.

---

## Milestone 3 — Engine Airdrop (Off-chain → Wallet)

Distribusi token PIN via airdrop Solana.

- **Pertimbangan teknis:**
  - Apakah PIN adalah SPL token (mint) atau cukup off-chain book-entry? Default saat ini off-chain; **airdrop = transfer SPL token dari treasury/wallet airdropper ke wallet buyer** kalau PIN di-mint.
  - Butuh kunci privat wallet pengirim (treasury) — simpan di server env (`AIRDROP_KEYPAIR` / `PRIVATE_KEY`), jangan pernah di client.
  - RPC: gunakan endpoint yang sudah ada atau provider (Helius/QuickNode) untuk kecepatan & reliability.
- **Server action/API** `POST /api/admin/airdrop`:
  - Re-check `requireAdmin()`.
  - Validate wallet receiver (SPL token account harus ada / bisa dibuat via `getOrCreateAssociatedTokenAccount`).
  - Transfer via SPL `createTransferInstruction`.
  - Simpan `txId` + status ke collection `airdrops`.
- **Retry:** untuk status `failed`, admin bisa trigger ulang (increment `retries`, limit misal 5).
- **Pendekatan batch:** airdrop ke banyak wallet sekaligus (loop / sequential dengan rate limit) + laporan hasil per wallet.

**Acceptance:**
- [ ] Airdrop single wallet sukses (mainnet/devnet test).
- [ ] Airdrop batch mencatat status per wallet.
- [ ] Retry untuk failed works & mencatat `retries`.
- [ ] Kunci privat hanya di server env, tidak bocor ke client.

---

## Milestone 4 — Dashboard Admin

- `/admin` dashboard:
  - Total purchase, total token teralokasi, total SOL terkumpul (di collection wallet).
  - Statistik: user count, wallet linked, rate (USD/IDR) live, banned IP count.
  - Quick link ke ban management (eksisting `/api/security/bans`), airdrop, purchases, users.
- `/admin/purchases` — list semua purchases (user, wallet, amount, date, status) + detail.
- `/admin/users` — list user, role, wallets, jumlah purchase. (Optional: set/revoke admin role.)

**Acceptance:**
- [ ] Semua data penting terlihat di dashboard.
- [ ] Halaman purchases & users berfungsi dengan pagination.

---

## Milestone 5 — Polishing & Test

- Form input validasi RHF untuk admin (misal: pilih wallet target airdrop).
- Empty states, loading states, konfirmasi sebelum airdrop mass.
- Rate limit khusus admin (misal request airdrop di-enforce limit lebih tinggi atau endpoint khusus).
- Test end-to-end: purchase → muncul di eligible → airdrop → status success → user lihat token di wallet.
- Dokumentasi airdrop di README.

---

## Dependencies / Keputusan yang Perlu Diambil

- [ ] **PIN sebagai SPL token atau off-chain?** Menentukan apakah airdrop butuh on-chain transfer (SPL) atau cukup update DB. (Rekomendasi: SPL token mint agar token benar-benar di wallet user.)
- [ ] Airdrop dari wallet treasury yang mana — buat mint baru / pakai collection wallet?
- [ ] Provider RPC untuk airdrop reliability (public endpoint bisa kena rate limit).
- [ ] Admin pertama: via `ADMIN_EMAIL` env saat signup, atau CLI seeder?

---

## Prioritas

1. **M1** role & auth (fundamental, semua fitur admin bergantung).
2. **M2** model & data eligible (fundamental untuk airdrop).
3. **M4** dashboard (nilai cepat, pakai data yang sudah ada).
4. **M3** engine airdrop (tergantung keputusan SPL/off-chain).
5. **M5** polish & test.

Urutan kerja disarankan: **M1 → M2 → M4 → M3 → M5**.
