# PLAN: Community Feature

## Overview

Halaman komunitas tempat user bisa posting "tweet" dengan gambar. Setiap post dikenakan biaya **0.00025 SOL** (sementara SOL, kedepan SURU token). Gambar disimpan di **Minio S3**.

---

## Arsitektur

```
User tulis post → upload gambar ke Minio (via presigned URL) → 
bayar 0.00025 SOL → submit dengan tx signature → 
server verifikasi on-chain → post disimpan ke MongoDB
```

---

## Files yang Dibuat

### 1. Docker Compose (`docker/docker-compose.yml`)

```yaml
services:
  minio:
    image: quay.io/minio/minio
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

volumes:
  minio_data:
```

---

### 2. Minio Client Library (`lib/minio-client.ts`)

Wrapper singleton untuk operasi Minio S3:

```
- getMinioClient()           → singleton Minio client
- createBucketIfNotExists()  → auto-create bucket (dipanggil di instrumentation.ts)
- uploadFile(buffer, key, contentType) → putObject ke bucket
- getPresignedDownloadUrl(key) → presigned GET URL (untuk tampil gambar via <img>)
- deleteFile(key)            → removeObject
```

Pattern dari artikel (Alex Efimenko): gunakan `Minio.Client` dengan env config, singleton,
presigned URLs untuk download (bypass 4MB response limit Next.js).

---

### 3. Feature: Community (`features/community/`)

```
features/community/
├── index.ts                    # Barrel exports
├── config.ts                   # COMMUNITY_FEE_SOL, MINIO_* env getters
├── actions/
│   └── community.ts            # createPost server action
├── components/
│   ├── PostForm.tsx            # "use client" form (text + image + FeePayment)
│   ├── PostCard.tsx            # Display single post
│   ├── PostFeed.tsx            # Post list/feed
│   └── ImageUpload.tsx         # Image upload with preview
├── models/
│   └── Post.ts                 # Mongoose model
└── lib/
    └── upload.ts               # Server-only: save image to Minio, presigned URL
```

---

### 4. Model: Post (`features/community/models/Post.ts`)

```typescript
interface PostDocument {
  content: string          // Post text content
  images: string[]         // Array of Minio object keys
  userId: ObjectId         // Ref User
  txSignature: string      // Unique Solana tx (pembayaran)
  solLamports: number      // Fee yang dibayar
  createdAt: Date          // Timestamp
}
```

Indexes: `userId` (compound with createdAt for feed query), `txSignature` (unique sparse)

---

### 5. Image Upload Flow

Gunakan **presigned PUT URL** (direkomendasikan artikel Alex Efimenko):

```
1. Client (ImageUpload) pilih file
2. Client hit API: POST /api/upload → server generate presigned PUT URL
3. Client upload langsung ke Minio via fetch PUT ke presigned URL
4. Client dapat key, tampilkan preview dari presigned GET URL
5. Saat submit post, kirim key[] ke server action
```

**Kenapa presigned URL**:
- Tidak ada limit 4MB (berbeda dengan upload via API route yang dibatasi Next.js)
- Tidak membebani server Next.js dengan stream file
- Gambar langsung ke Minio dari browser

---

### 6. API Routes

#### `app/api/upload/route.ts` — POST
- Terima `{ fileName, contentType, fileSize }`
- Validasi: max 5MB, type JPEG/PNG/WebP
- Generate key: `community/{userId}/{nanoid}-{filename}`
- Generate presigned PUT URL via `s3Client.presignedPutObject()`
- Return `{ key, presignedUrl, downloadUrl }`

#### `app/api/images/[key]/route.ts` — GET
- Generate presigned GET URL
- Redirect ke presigned URL
- (Alternatif: langsung serve presigned URL di `<img src>`)

---

### 7. Server Action: `createPost`

```typescript
"use server"
export async function createPost(state: FormState, formData: FormData) {
  // 1. Rate limit
  // 2. Verify session (auth)
  // 3. Validate: content (1-280 chars), images (max 4), txSignature
  // 4. Verify txSignature uniqueness (no double-spend)
  // 5. Verify on-chain: at least COMMUNITY_FEE_SOL to collection wallet
  // 6. Save Post to MongoDB
  // 7. Revalidate /community
  // 8. Redirect to /community
}
```

---

### 8. Halaman: `/community`

#### `app/community/page.tsx` (Server Component)
- Fetch posts dari MongoDB (newest first, limit 20)
- Untuk setiap post, generate presigned GET URL untuk tiap gambar
- Render `<PostFeed>` (Client Component)

#### `app/community/page.tsx` — PostFeed (Client Component)
- PostForm di atas
- Scroll list post cards
- Infinite scroll atau "Load more"

#### `app/community/[postId]/page.tsx` (Server Component)
- Single post detail (optional, bisa di-skip dulu)

---

### 9. Komponen UI

#### `PostForm.tsx`
```
┌─────────────────────────────┐
│ [Textarea: "What's up?"]    │
│                             │
│ [ImageUpload: + Add Image]  │
│ ┌─────┐ ┌─────┐            │
│ │ img │ │ img │  preview   │
│ └─────┘ └─────┘            │
│                             │
│ [FeePayment: 0.00025 SOL]   │
│                             │
│ [Post — disabled if unpaid] │
└─────────────────────────────┘
```

#### `PostCard.tsx`
```
┌─────────────────────────────┐
│ 👤 Name · 2h ago            │
│                             │
│ Post content text...        │
│                             │
│ ┌──────────┐ ┌──────────┐  │
│ │  image1  │ │  image2  │  │
│ └──────────┘ └──────────┘  │
│                             │
│ 🔗 View on Solscan          │
└─────────────────────────────┘
```

---

### 10. Environment Variables

Ditambahkan ke `.env.example` dan `.env.local`:

```env
# Community
COMMUNITY_FEE_SOL=0.00025

# Minio S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pinnedex-community
MINIO_USE_SSL=false
```

---

### 11. Route Protection

Tambah `/community` ke `protectedRoutes` di `proxy.ts`:

```typescript
const protectedRoutes = ["/app", "/profile", "/community"];
```

---

### 12. Startup (`instrumentation.ts`)

Auto-create Minio bucket saat server start:

```typescript
// Di register()
await createBucketIfNotExists();
```

---

### 13. Packages

```bash
npm install minio nanoid
```

---

## Checklist Implementasi

- [ ] Docker compose dengan Minio
- [ ] `lib/minio-client.ts` — Minio singleton + helpers
- [ ] `features/community/config.ts` — env getters
- [ ] `features/community/models/Post.ts` — Mongoose model
- [ ] `features/community/lib/upload.ts` — upload helpers
- [ ] `app/api/upload/route.ts` — presigned PUT URL API
- [ ] `features/community/actions/community.ts` — createPost server action
- [ ] `features/community/components/ImageUpload.tsx` — upload dengan preview
- [ ] `features/community/components/PostForm.tsx` — form post + FeePayment
- [ ] `features/community/components/PostCard.tsx` — tampilan post
- [ ] `features/community/components/PostFeed.tsx` — list post
- [ ] `features/community/index.ts` — barrel
- [ ] `app/community/page.tsx` — halaman feed
- [ ] `proxy.ts` — tambah `/community` ke protected
- [ ] `instrumentation.ts` — auto-create bucket
- [ ] `.env.example` + `.env.local` — tambah env vars
- [ ] Typecheck + lint
