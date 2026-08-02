# PIN-DEX

Presale DApp berbasis Solana + Next.js (App Router) dengan penyimpanan data off-chain di MongoDB. Pengguna membeli token PIN dengan mentransfer SOL ke collection wallet, lalu mengirim signature transaksi untuk verifikasi. Alokasi token dicatat di database dan akan di-airdrop setelah presale.

## Tech Stack

- **Next.js 16** (App Router, RSC, Server Actions) — lihat `node_modules/next/dist/docs/` untuk API yang berbeda dari versi lama
- **React Hook Form + Zod** (form validation) + shadcn/ui components
- **MongoDB** (Mongoose) via Docker container `container-mongo` (WSL)
- **Solana Web3** — transfer SOL on-chain; verifikasi signature
- **tweetnacl** — verifikasi tanda tangan wallet (Ed25519)

## Prasyarat

- Node.js 20+
- MongoDB berjalan di `localhost:27017` (container `container-mongo`)
- Solana wallet untuk collection (kunci dipakai di sisi admin/airdrop)

## Setup

```bash
npm install
cp .env.example .env.local   # lalu isi kredensial
npm run dev                  # development
npm run build && npm run start  # production
```

> **PENTING:** Prod build dipakai untuk testing karena Turbopack dev-mode punya masalah stabilitas Server Action ID ("Failed to find Server Action"). Gunakan `npm run start` untuk dev/test yang andal.

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Yang penting:

| Variable | Deskripsi |
|---|---|
| `MONGODB_URI` | Connection string Mongo dengan auth |
| `SESSION_SECRET` | Secret untuk signing session cookie (jose HS256) |
| `RATE_LIMIT_PER_MINUTE` | Max request per IP per menit sebelum di-ban (default 5) |
| `EXCHANGE_RATE_API_KEY` | API key exchangerate-api untuk rate USD→IDR |
| `PRESALE_COLLECTION_WALLET` | Solana wallet tujuan transfer SOL |
| `PRESALE_START` / `PRESALE_END` | Window presale |
| `IDR_PER_SOL` | Fallback rate jika API mati |
| `TOKEN_PRICE_IDR` | Harga 1 token (default Rp5) |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC endpoint |

## Fitur

### Auth
- Register/login email+password (Zod validated, RHF forms)
- Session cookie httpOnly 7 hari (jose)
- Verifikasi kepemilikan wallet (link wallet) via tweetnacl sign message
- Multi-wallet: setiap user bisa punya banyak wallet (link/unlink)

### Presale
- Halaman `/presale` menampilkan harga token (IDR + USD live)
- Buy form: input token (RHF + Slider), hitung SOL, transfer ke collection wallet
- Setelah transfer, user submit **tx signature** untuk verifikasi on-chain
- Alokasi = `floor(solLamports / 1e9 × IDR_PER_SOL ÷ TOKEN_PRICE_IDR)` di-clamp [100, 10000]
- Rekam pembelian di collection `purchases` (hanya wallet yang terverifikasi yang tercatat)

### Rates
- Rate USD→IDR dari exchangerate-api, disimpan di collection `exchangerates` (TTL 24 jam)
- `instrumentation.ts` refresh saat start + interval 24 jam
- `GET /api/rates` (baca) & `POST /api/rates` (refresh manual)

### Keamanan
- Rate limiting per IP: 5 request/menit (sliding window, `x-forwarded-for` → `x-real-ip`)
- **Ban permanen** otomatis saat melebihi limit → semua route langsung 429
- Admin ban management: `GET/POST/DELETE /api/security/bans`
- Rate limit diterapkan di semua server actions (signup, login, linkWallet, submitPurchase) dan API routes (/api/rpc, /api/rates, /api/security/bans)

### Halaman
| Route | Isi |
|---|---|
| `/` | Landing page |
| `/register`, `/login` | Auth (RHF + eye toggle password) |
| `/presale` | Beli token + wallet manager |
| `/leaderboard` | Daftar pembeli teratas |
| `/profile` | Profil user + wallet manager |
| `/app` | Halaman terkunci, hanya terbuka setelah purchase terverifikasi |

## Struktur

```
app/                # Pages + API routes
  api/rates/        # GET (baca), POST (refresh)
  api/rpc/          # Solana RPC proxy (rate-limited)
  api/security/bans/ # Admin ban management
features/           # Feature modules
  auth/             # models, actions, components
  wallet/           # linkWallet, unlinkWallet, WalletManager
  presale/          # config, models, verify, actions, BuyForm
  rates/            # exchange rate service + model
  security/         # IpRateLimit, BannedIp, rateLimit.ts
  solana/           # Solana helpers
lib/                # mongodb, session, dal, definitions (zod), format
instrumentation.ts  # Daily rate refresh scheduler
proxy.ts            # Route guard middleware (/app, /profile vs /login, /register)
```

## Mengelola Rate Limit / Ban

```bash
# List banned IP
curl http://localhost:3000/api/security/bans

# Ban manual
curl -X POST -H "Content-Type: application/json" \
  -d '{"ip":"1.2.3.4","reason":"spam"}' \
  http://localhost:3000/api/security/bans

# Unban
curl -X DELETE "http://localhost:3000/api/security/bans?ip=1.2.3.4"
```

> Endpoint ini ikut rate-limited. Kalau IP admin sendiri ke-ban, unban pakai IP berbeda atau langsung lewat Mongo:
> `wsl docker exec container-mongo mongosh "mongodb://USER:PASS@localhost:27017/pin-dex?authSource=admin" --eval "db.bannedips.deleteOne({ip:'1.2.3.4'})"`

## Scripts

```bash
npm run dev        # dev server (Turbopack) — kurang stabil untuk Server Actions
npm run build      # production build
npm run start      # start production server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
