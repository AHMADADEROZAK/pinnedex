import { randomInt, randomUUID } from "node:crypto";

import { connectToDatabase } from "@/lib/mongodb";
import { Challenge, type ChallengeDocument, type ChallengeStatus } from "@/features/chat/models/Challenge";
import { PartyMember } from "@/features/chat/models/PartyMember";
import { PartyMessage } from "@/features/chat/models/PartyMessage";

export const PARTY_MAX_MESSAGES = 150;

export type PartyMemberLean = {
  memberId: string;
  name: string;
  username?: string;
};

export type PartyMessageLean = {
  id: string;
  memberId: string;
  name: string;
  text: string;
  createdAt: Date;
};

type ChallengeLean = {
  uuid: string;
  username: string;
  name?: string;
  phone?: string;
  chatId?: string;
  status: ChallengeStatus;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
};

async function ensure() {
  await connectToDatabase();
}

export async function createChallenge(
  username = "",
  room?: "party",
): Promise<ChallengeDocument> {
  await ensure();
  return Challenge.create({
    uuid: randomUUID(),
    username,
    status: "pending",
    room,
  });
}

export async function findChallengeByUuid(uuid: string): Promise<ChallengeLean | null> {
  await ensure();
  return Challenge.findOne({ uuid }).lean<ChallengeLean | null>().exec();
}

export async function findChallengeWithOtp(uuid: string): Promise<ChallengeLean | null> {
  await ensure();
  return Challenge.findOne({
    uuid,
    status: "awaiting_otp",
    otp: { $exists: true },
    otpExpiresAt: { $exists: true },
  })
    .lean<ChallengeLean | null>()
    .exec();
}

export async function linkChallenge(uuid: string, chatId: string): Promise<void> {
  await ensure();
  await Challenge.updateOne({ uuid }, { $set: { chatId } }).exec();
}

export async function verifyChallenge(uuid: string, name: string): Promise<void> {
  await ensure();
  await Challenge.updateOne({ uuid }, { $set: { status: "verified", name } }).exec();
}

export async function setChallengeOtp(
  uuid: string,
  otpHash: string,
  expiresAt: Date,
): Promise<void> {
  await ensure();
  await Challenge.updateOne(
    { uuid },
    { $set: { otp: otpHash, otpExpiresAt: expiresAt, status: "awaiting_otp" } },
  ).exec();
}

export async function setChallengeUsername(uuid: string, username: string): Promise<void> {
  await ensure();
  await Challenge.updateOne({ uuid }, { $set: { username } }).exec();
}

export async function deleteStaleChallenges(olderThanMs: number): Promise<number> {
  await ensure();
  const cutoff = new Date(Date.now() - olderThanMs);
  const res = await Challenge.deleteMany({
    status: { $in: ["pending", "awaiting_otp"] },
    createdAt: { $lt: cutoff },
  }).exec();
  return res.deletedCount ?? 0;
}

export async function joinPartyMember(
  name: string,
  username?: string,
): Promise<PartyMemberLean> {
  await ensure();

  if (username) {
    const existing = await PartyMember.findOne({ username })
      .lean<PartyMemberLean | null>()
      .exec();
    if (existing) return existing;
  }

  const doc = await PartyMember.create({
    memberId: String(randomInt(1_000_000, 9_999_999)),
    name,
    username,
  });

  return {
    memberId: doc.memberId,
    name: doc.name,
    username: doc.username,
  };
}

export async function findPartyMember(
  memberId: string,
): Promise<PartyMemberLean | null> {
  await ensure();
  return PartyMember.findOne({ memberId }).lean<PartyMemberLean | null>().exec();
}

export async function getPartyMessageCount(): Promise<number> {
  await ensure();
  return PartyMessage.countDocuments().exec();
}

export async function insertPartyMessage(
  member: PartyMemberLean,
  text: string,
): Promise<PartyMessageLean> {
  await ensure();
  const doc = await PartyMessage.create({
    id: randomUUID(),
    memberId: member.memberId,
    name: member.name,
    text,
  });
  return {
    id: doc.id,
    memberId: doc.memberId,
    name: doc.name,
    text: doc.text,
    createdAt: doc.createdAt,
  };
}

export async function getRecentPartyMessages(limit = 50): Promise<PartyMessageLean[]> {
  await ensure();
  const docs = await PartyMessage.find({})
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean<PartyMessageLean[]>()
    .exec();
  return docs;
}