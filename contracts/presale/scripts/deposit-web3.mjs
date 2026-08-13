/**
 * Deposit SPINE tokens into the program's token vault
 * Run: node scripts/deposit-web3.mjs
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { createHash } from "crypto";

const RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3");
const TOKEN_MINT = new PublicKey("8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

function discriminator(name) {
  const hash = createHash("sha256").update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

function encodeU64(val) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(val));
  return buf;
}

const keypairData = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));
console.log("Admin:", admin.publicKey.toBase58());

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("presale"), admin.publicKey.toBuffer(), TOKEN_MINT.toBuffer()],
  PROGRAM_ID
);
const [tokenVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_vault"), configPda.toBuffer()],
  PROGRAM_ID
);

// Admin's SPINE ATA
const ADMIN_ATA = new PublicKey("4RqtNsykqGDyBammC2Q2aH26pyvwiMui1ygHseZg9NpW");

console.log("Config PDA:", configPda.toBase58());
console.log("Token Vault:", tokenVault.toBase58());
console.log("Admin ATA:", ADMIN_ATA.toBase58());

// Check admin balance first
const connection = new Connection(RPC_URL, "confirmed");
const adminAtaInfo = await connection.getParsedAccountInfo(ADMIN_ATA);
if (adminAtaInfo.value) {
  const parsed = adminAtaInfo.value.data.parsed;
  console.log("Admin SPINE balance:", parsed.info.tokenAmount.uiAmount);
}

const DEPOSIT_AMOUNT = 800_000_000_000_000; // 800T

console.log("\nDepositing", DEPOSIT_AMOUNT, "SPINE to token vault...");

const disc = discriminator("deposit_tokens");
const data = Buffer.concat([disc, encodeU64(DEPOSIT_AMOUNT)]);

const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: tokenVault, isSigner: false, isWritable: true },
    { pubkey: ADMIN_ATA, isSigner: false, isWritable: true },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
  ],
  data,
});

const tx = new Transaction().add(ix);
const sig = await sendAndConfirmTransaction(connection, tx, [admin]);
console.log("\nSUCCESS!");
console.log("TX:", sig);
console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

// Verify vault balance
const vaultInfo = await connection.getParsedAccountInfo(tokenVault);
if (vaultInfo.value) {
  const parsed = vaultInfo.value.data.parsed;
  console.log("\nToken Vault SPINE balance:", parsed.info.tokenAmount.uiAmount);
}
