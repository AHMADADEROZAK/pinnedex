/**
 * Initialize presale config on devnet using @solana/web3.js v1
 * Run: node scripts/initialize-web3.mjs
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { createHash } from "crypto";

// ── Config ──
const RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3");
const TOKEN_MINT = new PublicKey("8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");

// Anchor discriminator: first 8 bytes of sha256("global:initialize_presale")
function discriminator(name) {
  const hash = createHash("sha256").update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

function encodeU64(val) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(val));
  return buf;
}

function encodeI64(val) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(val));
  return buf;
}

// ── Load admin keypair ──
import { homedir } from "os";
const keypairPath = process.env.SOLANA_KEYPAIR ?? homedir() + "/.config/solana/id.json";
const keypairData = JSON.parse(readFileSync(keypairPath, "utf-8"));
const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));
console.log("Admin:", admin.publicKey.toBase58());

// ── Derive PDAs ──
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("presale"), admin.publicKey.toBuffer(), TOKEN_MINT.toBuffer()],
  PROGRAM_ID
);
const [tokenVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_vault"), configPda.toBuffer()],
  PROGRAM_ID
);
const [vaultAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault_authority"), configPda.toBuffer()],
  PROGRAM_ID
);
const [solVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("sol_vault"), configPda.toBuffer()],
  PROGRAM_ID
);

console.log("Config PDA:", configPda.toBase58());
console.log("Token Vault:", tokenVault.toBase58());
console.log("Vault Authority:", vaultAuthority.toBase58());
console.log("SOL Vault:", solVault.toBase58());

// ── Presale params ──
const pricePerToken = 1000; // 1000 lamports per SPINE → 1 SOL = 1M SPINE
const now = Math.floor(Date.now() / 1000);
const saleStart = now - 86400; // started yesterday
const saleEnd = now + 30 * 86400; // 30 days from now
const cliffDuration = 7 * 86400; // 7 days
const vestingDuration = 30 * 86400; // 30 days
const hardCapTokens = 800_000_000_000_000; // 800T

console.log("\nParameters:");
console.log("  pricePerToken:", pricePerToken, "lamports");
console.log("  saleStart:", new Date(saleStart * 1000).toISOString());
console.log("  saleEnd:", new Date(saleEnd * 1000).toISOString());
console.log("  cliffDuration:", cliffDuration, "s (7 days)");
console.log("  vestingDuration:", vestingDuration, "s (30 days)");
console.log("  hardCapTokens:", hardCapTokens);

// ── Build instruction data ──
const disc = discriminator("initialize_presale");
const data = Buffer.concat([
  disc,
  encodeU64(pricePerToken),
  encodeI64(saleStart),
  encodeI64(saleEnd),
  encodeI64(cliffDuration),
  encodeI64(vestingDuration),
  encodeU64(hardCapTokens),
]);

// ── Build instruction ──
const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: tokenVault, isSigner: false, isWritable: true },
    { pubkey: vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: solVault, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
  ],
  data,
});

// ── Send ──
const connection = new Connection(RPC_URL, "confirmed");

console.log("\nChecking if config already exists...");
const existing = await connection.getAccountInfo(configPda);
if (existing) {
  console.log("Config PDA already exists, skipping initialize.");
  console.log("Data length:", existing.data.length);
  process.exit(0);
}

console.log("Sending initialize_presale transaction...");
const tx = new Transaction().add(ix);
const sig = await sendAndConfirmTransaction(connection, tx, [admin]);
console.log("\nSUCCESS!");
console.log("TX:", sig);
console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
