# SPINE Presale — Mainnet Migration Guide

Panduan lengkap migrasi sistem presale SPINE dari devnet ke mainnet.

---

## 1. Status Saat Ini (Devnet)

| Item | Value |
|---|---|
| Program ID | `6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3` |
| Token Mint | `8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip` |
| Config PDA | `2wgFAkyxaa1cEdEnzZ1SxP3yQp5thVzFYYbqT7RpeueW` |
| Token Vault | `C5PPRbmGQy68mtn4v3BN5akAtywChDU6cTtV1ZrM3Uan` (800T SPINE) |
| SOL Vault | `DKSew5jNpYHjswcFy38orDWaJTbmRkSNUsvgY2SLZVZx` |
| Price | 1,000 lamports/SPINE |
| Vesting | 7d cliff + 30d linear |
| Hard Cap | 800,000,000,000,000 SPINE |

**Instruksi program (7):** `initialize_presale`, `init_token_vault`, `deposit_tokens`, `buy_tokens`, `claim_tokens`, `withdraw_sol`, `finalize_presale`

---

## 2. Checklist Pra-Mainnet

### 2.1 Keamanan Kontrak
- [ ] **Audit manual** — review ulang semua 7 instruksi di `contracts/presale/programs/presale/src/`
- [ ] **Test lengkap di devnet** — buy → claim (setelah cliff) → withdraw, end-to-end
- [ ] **Batasi otoritas** — pastikan hanya admin keypair yang bisa `withdraw_sol`, `deposit_tokens`, `finalize_presale`
- [ ] **Cek math overflow** — semua kalkulasi pakai `checked_*` (sudah ✅)
- [ ] **Pertimbangkan freeze mint authority** — setelah distribusi final, cabut mint authority supaya supply tidak bisa ditambah
- [ ] **Revoke upgrade authority (OPSIONAL, permanent)** — setelah yakin kontrak final: `solana program set-upgrade-authority <PROGRAM_ID> --final` — **WARNING: tidak bisa di-upgrade lagi setelah ini!**

### 2.2 Wallet & Key Management
- [ ] **Pindahkan keypair ke cold storage** — jangan simpan `id.json` di server/WSL untuk mainnet
- [ ] **Backup seed phrase** semua wallet penting (admin, presale vault, airdrop, dev, ops)
- [ ] **Siapkan wallet mainnet terpisah** — jangan pakai wallet devnet
- [ ] **Gunakan multisig** (Squads) untuk treasury/ops wallet — sangat direkomendasikan

### 2.3 Finansial
- [ ] **Siapkan SOL untuk deploy** — program ~250KB butuh ~2-3 SOL untuk rent-exempt
- [ ] **Siapkan SOL untuk init accounts** — config PDA, token vault, dll (~0.1 SOL)
- [ ] **Kalkulasi harga final** — sesuaikan `price_per_token` dengan harga SOL real-time

---

## 3. Langkah Migrasi Mainnet

### Step 1: Mint SPL Token SPINE di Mainnet

```bash
# Set cluster ke mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Buat token (gunakan wallet mainnet)
spl-token create-token --decimals 0

# Simpan TOKEN_MINT address yang keluar!

# Buat ATA untuk setiap alokasi
spl-token create-account <TOKEN_MINT> --owner <PRESALE_VAULT_WALLET> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token create-account <TOKEN_MINT> --owner <AIRDROP_WALLET> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token create-account <TOKEN_MINT> --owner <DEV_WALLET> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token create-account <TOKEN_MINT> --owner <OPS_WALLET> --fee-payer ~/.config/solana/mainnet-admin.json

# Mint 1 Quadrillion ke ATA admin
spl-token create-account <TOKEN_MINT> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token mint <TOKEN_MINT> 1000000000000000

# Distribusi sesuai tokenomics
spl-token transfer <TOKEN_MINT> 800000000000000 <PRESALE_VAULT_ATA> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token transfer <TOKEN_MINT> 50000000000000 <AIRDROP_ATA> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token transfer <TOKEN_MINT> 70000000000000 <DEV_ATA> --fee-payer ~/.config/solana/mainnet-admin.json
spl-token transfer <TOKEN_MINT> 80000000000000 <OPS_ATA> --fee-payer ~/.config/solana/mainnet-admin.json
```

### Step 2: Set Token Metadata (Metaplex)

Nama, simbol, dan logo token perlu diset via Metaplex Token Metadata. Bisa pakai:
- [Solana Token Creator](https://www.solanatoken.com/) (UI)
- Atau script `mpl-token-metadata`

```
Name: SPINE
Symbol: SPINE
URI: https://pinnedex.ai/spine-metadata.json
```

Siapkan `spine-metadata.json` (host di domain sendiri):
```json
{
  "name": "SPINE",
  "symbol": "SPINE",
  "description": "SPINE — the native token of PIN-DEX",
  "image": "https://pinnedex.ai/spine-icon.png"
}
```

### Step 3: Deploy Program ke Mainnet

```bash
cd contracts/presale

# Build deterministik (WAJIB solana-verify build, bukan anchor build — supaya hash bisa diverifikasi publik)
solana-verify build

# Deploy dengan program keypair yang SAMA (biar Program ID tetap)
solana program deploy \
  --program-id target/deploy/presale-keypair.json \
  target/deploy/presale.so \
  --url https://api.mainnet-beta.solana.com
```

> **Note:** Program ID akan tetap `6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3` karena keypair-nya sama. Kalau mau ID baru, generate keypair baru dan update `declare_id!` di `lib.rs`.

### Step 3b: Verified Build & Badge (solana-verify)

**Status devnet (sudah selesai):**
- Build hash == onchain hash: `7d73a3029bd2f2a1a1fe10d9196e69ec5255f639ba9dcc55b359de72139f1605`
- PDA verification terupload di devnet: tx `2re86424ZGgkQ9gd9eakn6dmTe7GCg4b98KnRZQCkhxt4hFamdvg9fQp9QjC3zoDWfjuXHYBG2sPy1hk22bDZD85`
- Upgrade authority: `2hsTq8QVdkuNhEcjgZbbDz2LXRudMfofixZV5hiQi417`
- Repo public: `AHMADADEROZAK/pinnedex`, branch `presale/v1.0.0`, commit `03a06da`

Kunci reproducible: `contracts/presale/Cargo.toml` berisi `[workspace.metadata.cli] solana = "3.1.14"` (agave 3.1.14 → platform-tools v1.52 / rust 1.89, sama dengan toolchain build devnet). **Jangan jalankan `cargo update`** — lockfile harus tetap seperti commit `03a06da` atau hash verifikasi berubah.

Setelah `.so` mainnet ter-deploy (Step 3), jalankan dari WSL:

```bash
# 1. Upload PDA verifikasi + cek hash match (jawab YES / flag -y)
solana-verify verify-from-repo -um \
  --program-id 6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3 \
  --commit-hash 03a06da \
  --mount-path contracts/presale \
  --library-name presale \
  -y \
  https://github.com/AHMADADEROZAK/pinnedex

# 2. Queue job OtterSec (badge "Verified" di Explorer/Solscan) — MAINNET ONLY
solana-verify remote submit-job \
  --program-id 6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3 \
  --uploader 2hsTq8QVdkuNhEcjgZbbDz2LXRudMfofixZV5hiQi417
```

> **PENTING:**
> - `remote submit-job` hanya berjalan di mainnet (error di devnet).
> - Jika source berubah setelah `03a06da`, commit ulang dan ganti `--commit-hash` ke commit baru.
> - Wallet config WSL (`id.json` = upgrade authority) harus tersedia saat `verify-from-repo`.

### Step 4: Initialize Presale di Mainnet

```bash
# Edit scripts/initialize-web3.mjs:
# - RPC_URL → https://api.mainnet-beta.solana.com
# - TOKEN_MINT → token mint mainnet baru
# - Sesuaikan price_per_token, saleStart, saleEnd, cliff, vesting, hardCap
# - Keypair path → mainnet admin keypair

node scripts/initialize-web3.mjs
```

### Step 5: Init Token Vault

```bash
# Edit scripts/init-vault-web3.mjs dengan parameter mainnet
node scripts/init-vault-web3.mjs
```

### Step 6: Deposit Tokens ke Vault

```bash
# Transfer 800T dari presale vault wallet ke admin ATA dulu (jika perlu)
spl-token transfer <TOKEN_MINT> 800000000000000 <ADMIN_ATA> \
  --owner ~/presale-vault-mainnet.json \
  --fee-payer ~/.config/solana/mainnet-admin.json \
  --url https://api.mainnet-beta.solana.com

# Lalu deposit ke program token vault
# Edit scripts/deposit-web3.mjs dengan parameter mainnet
node scripts/deposit-web3.mjs
```

### Step 7: Update Frontend untuk Mainnet

Update `.env.production`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
# atau gunakan RPC premium (Helius, QuickNode, Triton) untuk mainnet

PRESALE_PROGRAM_ID=6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3
PRESALE_TOKEN_MINT=<TOKEN_MINT_MAINNET>
PRESALE_PRICE_PER_TOKEN=<sesuaikan_dengan_harga_real>
PRESALE_ADMIN_WALLET=<ADMIN_WALLET_MAINNET>
PRESALE_START=2026-XX-XXT00:00:00Z
PRESALE_END=2026-XX-XXT23:59:59Z
```

File yang otomatis baca env (tidak perlu diubah):
- `features/presale/config.ts` — baca `PRESALE_*` env vars
- `features/presale/lib/pda.ts` — baca dari `presaleConfig`

**PENTING:** `SPINE_MINT` di `features/presale/lib/pda.ts` saat ini hardcoded ke devnet mint. Update ke mainnet mint atau jadikan env-based.

### Step 8: Verifikasi End-to-End di Mainnet

Lakukan test kecil sebelum launch:

1. **Test buy** — beli dengan jumlah kecil (0.01 SOL) dari wallet test
2. **Cek VestingAccount** — pastikan PDA terbuat dengan data benar
3. **Test claim** — setelah cliff period, coba claim
4. **Test withdraw** — withdraw SOL dari vault
5. **Monitor** — cek semua tx di Solana Explorer (mainnet)

---

## 4. Rekomendasi RPC Mainnet

Devnet RPC gratis tidak cocok untuk mainnet production. Gunakan RPC premium:

| Provider | Free Tier | Catatan |
|---|---|---|
| Helius | 100k credits/bulan | Recommended, support DAS API |
| QuickNode | 1 endpoint gratis | Stabil |
| Triton | Limited | Solana-focused |
| Alchemy | 300M compute units | Multi-chain |

Set di env:
```env
SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=<KEY>
```

---

## 5. Rollback Plan

Jika ada masalah setelah deploy mainnet:

1. **Selama upgrade authority belum dicabut** — bisa `solana program deploy` ulang untuk fix bug
2. **Jika sudah final** — deploy program baru dengan ID baru, update frontend env
3. **Emergency finalize** — panggil `finalize_presale` untuk stop pembelian
4. **Withdraw SOL** — panggil `withdraw_sol` untuk amankan dana ke admin wallet

---

## 6. Post-Launch Checklist

- [ ] Token metadata live di explorer (nama, logo, simbol muncul)
- [ ] Presale config terverifikasi on-chain
- [ ] Token vault balance sesuai (800T)
- [ ] Frontend buy flow berfungsi
- [ ] Claim flow berfungsi (test setelah cliff)
- [ ] Admin dashboard `/pin-0367/presale` menampilkan data benar
- [ ] Monitoring: set alert untuk SOL vault balance
- [ ] Dokumentasi publik: cara beli, vesting schedule, contract address
