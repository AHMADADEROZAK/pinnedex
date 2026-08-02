# Plan: Trust & Transparansi Treasury (Presale → LP)

## Latar

Treasury `pineRiSyDZrYYa5fVbWLn2bwjhwTaia4bUAw4xVPtiZ` tujuan akhirnya dipakai untuk membuat liquidity pool (LP). Trust model = **Lv 1 (transparansi)**, tanpa mengubah arsitektur on-chain (SOL → wallet, alokasi off-chain di Mongo).

## Tujuan

User bisa melihat ke mana SOL-nya pergi dan ada komitmen tertulis bahwa dana hanya dipakai untuk LP (dan LP burn pasca-listing).

## M1 — Helper server treasury

- `features/presale/server/treasury.ts` (server-only):
  - `getTreasuryBalance()` → `Connection(resolveRpcEndpoint())` → `getBalance(collectionWallet)` → `{ sol, lamports }`.
  - `try/catch` → return `null` bila RPC gagal (fallback di UI).

## M2 — Komponen TrustSection

- `features/presale/components/TrustSection.tsx` (server component).
- Props: `treasuryAddress`, `treasurySol` (`number | null`), `totalSolCollected`, `hardcapSol?`.
- Isi:
  - Alur 4 langkah: **presale → listing → LP creation → LP burn**.
  - Alamat treasury + link explorer (pola seperti profile page, pakai `solanaNetwork`).
  - Balance live dari RPC + total SOL terkumpul dari DB (status verified).
  - Komitmen tertulis: dana hanya untuk LP, LP burn = bukti anti-rug.

## M3 — Integrasi di `/presale`

- `app/presale/page.tsx`:
  - Query `Purchase.aggregate([{ $match: { status: "verified" } }, { $group: { _id: null, total: { $sum: "$solLamports" } } }])`.
  - Panggil `getTreasuryBalance()`.
  - Render `<TrustSection />` di bawah countdown, sebelum `<BuyForm />`.

## M4 — Polish & verifikasi

- Empty/error state untuk RPC gagal.
- Pastikan data ter-revalidate setelah purchase sukses.
- `typecheck` + `lint` + `build` bersih.

## Out of scope

- Verifikasi LP burn on-chain (tempel tx hash burn setelah listing, supaya user bisa cek sendiri) — catatan untuk nanti.
- Lv 2/3 (multisig/escrow) — hanya bila mau mengubah arsitektur.
