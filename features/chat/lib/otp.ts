import crypto from "node:crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;

const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOtp(): string {
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += charset[crypto.randomInt(0, charset.length)];
  }
  return otp;
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}