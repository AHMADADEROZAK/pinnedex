import "server-only"

import * as Minio from "minio"

const s3Client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "",
  secretKey: process.env.MINIO_SECRET_KEY ?? "",
  useSSL: process.env.MINIO_USE_SSL === "true",
})

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

export async function getPresignedDownloadUrl(key: string, expiry = 60 * 60) {
  return s3Client.presignedGetObject(bucketName, key, expiry)
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
  return s3Client.presignedPutObject(bucketName, key, expiry)
}
