import "server-only"

import * as Minio from "minio"

const s3Client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "",
  secretKey: process.env.MINIO_SECRET_KEY ?? "",
  useSSL: process.env.MINIO_USE_SSL === "true",
})

// Public client for presigned URLs: the browser must reach Minio via its
// public endpoint (e.g. https://s3.example.com), NOT the Docker-internal
// hostname. The Host header is part of the SigV4 signature, so presigned
// URLs must be generated against the public endpoint to validate.
const publicUrl = process.env.MINIO_PUBLIC_URL?.trim()
let publicClient: Minio.Client | null = null
if (publicUrl) {
  try {
    const u = new URL(publicUrl)
    publicClient = new Minio.Client({
      endPoint: u.hostname,
      port: u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80,
      accessKey: process.env.MINIO_ACCESS_KEY ?? "",
      secretKey: process.env.MINIO_SECRET_KEY ?? "",
      useSSL: u.protocol === "https:",
    })
  } catch {
    // fall back to the internal client below
  }
}

const bucketName = process.env.MINIO_BUCKET ?? "pinnedex"

export async function createBucketIfNotExists() {
  const exists = await s3Client.bucketExists(bucketName)
  if (!exists) {
    await s3Client.makeBucket(bucketName)
  }
}

export async function uploadFile({
  key,
  buffer,
  contentType,
}: {
  key: string
  buffer: Buffer
  contentType: string
}) {
  await createBucketIfNotExists()
  await s3Client.putObject(bucketName, key, buffer, buffer.length, {
    "Content-Type": contentType,
  })
}

const extToContentType: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
}

export const contentTypeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function objectKeyExt(contentType: string) {
  return contentTypeToExt[contentType] ?? "png"
}

function presignClient() {
  return publicClient ?? s3Client
}

export async function getPresignedDownloadUrl(key: string, expiry = 60 * 60) {
  // Force a safe image content-type on every served object so the browser
  // never renders an object as text/html or image/svg+xml (prevents stored XSS).
  const ext = key.split(".").pop()?.toLowerCase() ?? "png"
  const contentType = extToContentType[ext] ?? "image/png"
  return presignClient().presignedGetObject(bucketName, key, expiry, {
    "response-content-type": contentType,
  })
}

export async function deleteFile(key: string) {
  try {
    await s3Client.removeObject(bucketName, key)
  } catch {
    // ignore if file doesn't exist
  }
}

export async function getPresignedUploadUrl(
  key: string,
  expiry = 60 * 60,
) {
  await createBucketIfNotExists()
  return presignClient().presignedPutObject(bucketName, key, expiry)
}
