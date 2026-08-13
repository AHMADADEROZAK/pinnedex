/**
 * Initialize token vault PDA as SPL Token Account
 * Run: node scripts/init-vault-web3.mjs
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
import { homedir } from "os";
import { createHash } from "crypto";

const RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3");
const TOKEN_MINT = new PublicKey("8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");

function discriminator(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
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
const [vaultAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault_authority"), configPda.toBuffer()],
  PROGRAM_ID
);

console.log("Config PDA:", configPda.toBase58());
console.log("Token Vault:", tokenVault.toBase58());

const connection = new Connection(RPC_URL, "confirmed");

// Check if already exists
const existing = await connection.getAccountInfo(tokenVault);
if (existing) {
  console.log("Token vault already exists, owner:", existing.owner.toBase58());
  process.exit(0);
}

console.log("Initializing token vault...");

const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: tokenVault, isSigner: false, isWritable: true },
    { pubkey: vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
  ],
  data: discriminator("init_token_vault"),
});

const tx = new Transaction().add(ix);
const sig = await sendAndConfirmTransaction(connection, tx, [admin]);
console.log("\nSUCCESS!");
console.log("TX:", sig);
console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

// Verify
const vaultInfo = await connection.getParsedAccountInfo(tokenVault);
if (vaultInfo.value) {
  console.log("\nToken Vault initialized!");
  console.log("Owner:", vaultInfo.value.owner.toBase58());
}
