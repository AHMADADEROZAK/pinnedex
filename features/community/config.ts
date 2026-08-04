const num = (v: string | undefined, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export const communityConfig = {
  get feeSol() {
    return num(process.env.COMMUNITY_FEE_SOL, 0.00025)
  },
  get feeLamports() {
    return Math.round(this.feeSol * 1e9)
  },
  get maxContentLength() {
    return num(process.env.COMMUNITY_MAX_CONTENT_LENGTH, 280)
  },
  get maxImages() {
    return num(process.env.COMMUNITY_MAX_IMAGES, 4)
  },
  get maxImageSize() {
    return num(process.env.COMMUNITY_MAX_IMAGE_SIZE, 5 * 1024 * 1024) // 5MB
  },
  get allowedImageTypes() {
    return ["image/jpeg", "image/png", "image/webp"]
  },
}
