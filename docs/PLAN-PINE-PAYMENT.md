# PLAN: Pembayaran Pin PINE (SOL / PINE Toggle)

## Overview

Setelah token **PINE / PIN** berhasil di-mint, biaya post di Community
harus bisa dibayar pakai **PINE token** — mendukung **keduanya (toggle)**
antara **SOL** dan **PINE**.

Keputusan yang sudah disepakati:

| Item | Nilai |
|---|---|
| Mode | Dukung keduanya (toggle SOL / PINE) |
| Standar token | SPL Token (klasik), bukan Token-2022 |
| Desimal token | **9** desimal |
| Config | Placeholder via env (diisi nilai asli nanti) |

> Status sekarang: **semua biaya pin masih SOL** (`0.00025 SOL`) via
> `SystemProgram.transfer`. Tidak ada smart contract / SPL mint PINE
> sungguhan. Prasyarat: presale harus benar-benar **mint PINE** ke pembeli.

---

## Alur Sekarang (SOL)

```
User tulis post → upload gambar ke Minio → bayar 0.00025 SOL →
submit tx signature → server verifikasi on-chain (system transfer SOL) →
post disimpan ke MongoDB
```

- Client: `features/community/components/PinDialog.tsx:202` & `PostForm.tsx:77`
  → `SystemProgram.transfer({ lamports, toPubkey: collectionWallet })`.
- Server verifikasi: `verifyCommunityPayment()` di
  `features/community/actions/community.ts:97` — parse instruction program
  `system: transfer` ke `presaleConfig.collectionWallet`.

---

## Target Alur (PINE)

```
User tulis post → upload gambar → pilih asset: SOL | PINE →
bayar (SOL transfer ATAU SPL token transfer PINE) →
submit tx signature + asset →
server verifikasi: system transfer (SOL) ATAU token transfer (PINE) →
post disimpan ke MongoDB (simpan asset & amount)
```

---

## Perubahan yang Diperlukan

### 1. Dependensi

```bash
npm install @solana/spl-token
```

Dipakai untuk: `getAssociatedTokenAddress`, `createTransferInstruction`
(client), dan menghitung ATA tujuan untuk verifikasi (server).

---

### 2. Konfigurasi + env (placeholder)

`features/community/config.ts` tambah getter:

```typescript
get tokenMint()        => process.env.PINE_MINT ?? ""
get feePine()          => num(process.env.COMMUNITY_FEE_PINE, 0.01)   // # PINE per pin
get pineDecimals()     => num(process.env.PINE_DECIMALS, 9)
get feePineRaw()       => Math.round(this.feePine * 10 ** this.pineDecimals)
```

`.env.example` (dan `.env.local`):

```env
# PINE Token (Community pin payment)
PINE_MINT=
COMMUNITY_FEE_PINE=0.01
PINE_DECIMALS=9
```

---

### 3. Model: Post (`features/community/models/Post.ts`)

Tambah field opsional untuk melacak metode pembayaran:

```typescript
paymentAsset?: "sol" | "pine"   // default "sol"
paymentAmountRaw?: number       // fee dalam satuan terkecil (lamports / token raw)
```

**Catatan**: field baru dibiarkan `optional` agar data SOL lama tetap valid,
tidak perlu migrasi data.

---

### 4. Server Action (`features/community/actions/community.ts`)

- `PinnedSchema` tambah field: `asset: z.enum(["sol", "pine"]).default("sol")`.
- Ubah `verifyCommunityPayment(signature, asset)`:
  - `"sol"` → parsing **lama** (system transfer).
  - `"pine"` → parsing instruction program `spl-token` (`transfer` /
    `transferChecked`) dari `getParsedTransaction`:
    - `info.mint` === `communityConfig.tokenMint`.
    - `info.destination` === ATA(collectionWallet, mint).
    - `info.amount` (raw) ≥ `communityConfig.feePineRaw`.
    - Hitung ATA koleksi via `getAssociatedTokenAddress(mint, collectionPk)`.
- Saat `save Post`, isi `paymentAsset` & `paymentAmountRaw` sesuai hasil.

Perhatikan `info.amount` pada `transferChecked` adalah **raw**
(unit terkecil), sedangkan `transfer` biasa butuh konversi per decimals.

---

### 5. UI Composer (client)

`PinDialog.tsx` & `PostForm.tsx`:

- Tambah state `asset: "sol" | "pine"` + UI toggle/pill pilihan mata uang.
- Saat `"pine"`:
  - Bangun `Transaction` dengan `createTransferInstruction`:
    `getAssociatedTokenAddress(mint, userPk)` → ATA koleksi, `feePineRaw`.
  - Jika user belum punya ATA sumber, sertakan
    `createAssociatedTokenAccountInstruction` dalam tx yang sama.
- Saat submit, kirim `asset` ke action `pinned`.
- Teks biaya dinamis: `{feeSol} SOL` **atau** `{feePine} PINE`.
- Tambah validasi: jika `PINE_MINT` belum dikonfigurasi, disable opsi PINE
  (fallback SOL) supaya tidak error saat token belum live.

---

### 6. Verifikasi

- `npx tsc --noEmit`
- `npx eslint`
- Manual test: create pin pakai SOL (regresi) & pakai PINE.
- Pastikan `revalidatePath("/community")` tetap jalan untuk kedua path.

---

## Ruang Lingkup

**Masuk**: Pin paid Community (PinDialog + PostForm) → toggle SOL / PINE.

**KELUAR (bukan bagian task ini)**:
- Registration / login fee — tetap SOL.
- Presale purchase — tetap SOL (token airdrop/mint terpisah,
  lihat `docs/PLAN-ADMIN-AIRDROP.md`).
- Membuat SPL mint PINE itu sendiri.

---

## Checklist Implementasi

- [ ] `npm install @solana/spl-token`
- [ ] `features/community/config.ts` — getter tokenMint / feePine / decimals
- [ ] `.env.example` + `.env.local` — env placeholder PINE
- [ ] `features/community/models/Post.ts` — field `paymentAsset`, `paymentAmountRaw`
- [ ] `features/community/actions/community.ts` — schema `asset` + verifikasi PINE
- [ ] `PinDialog.tsx` — toggle SOL/PINE + createTransferInstruction
- [ ] `PostForm.tsx` — toggle SOL/PINE + createTransferInstruction
- [ ] Teks biaya dinamis di UI
- [ ] Fallback disable PINE jika mint belum dikonfigurasi
- [ ] Typecheck + lint
- [ ] Manual test SOL (regresi) & PINE