/**
 * Set Metaplex Token Metadata for legacy SPL token (SPINE)
 * Run: node scripts/set-metadata-web3.mjs
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
const TOKEN_MINT = new PublicKey("8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip");
const METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");

const NAME = "SPINE";
const SYMBOL = "SPINE";
const URI = "https://harlequin-geographical-krill-234.mypinata.cloud/ipfs/bafkreiahwvwgtjbbalt2uziur27yq27yomp5itour4mgzu35raq425lc3i";

// Borsh serialize helpers
function encodeString(s) {
  const buf = Buffer.from(s, "utf-8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(buf.length);
  return Buffer.concat([len, buf]);
}
function encodeU16(v) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(v);
  return buf;
}

const keypairData = JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"));
const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));
console.log("Authority:", admin.publicKey.toBase58());

const [metadataPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), METADATA_PROGRAM.toBuffer(), TOKEN_MINT.toBuffer()],
  METADATA_PROGRAM,
);
console.log("Metadata PDA:", metadataPda.toBase58());

// CreateMetadataAccountV3 discriminator = 33
// Data layout:
//   u8 instruction discriminator (33)
//   DataV2 { name, symbol, uri, sellerFeeBasisPoints: u16, creators: Option, collection: Option, uses: Option }
//   bool isMutable
//   Option<CollectionDetails> = 0 (None)
const data = Buffer.concat([
  Buffer.from([33]),
  encodeString(NAME),
  encodeString(SYMBOL),
  encodeString(URI),
  encodeU16(0),      // sellerFeeBasisPoints = 0
  Buffer.from([0]),  // creators: None
  Buffer.from([0]),  // collection: None
  Buffer.from([0]),  // uses: None
  Buffer.from([1]),  // isMutable: true
  Buffer.from([0]),  // collectionDetails: None
]);

const connection = new Connection(RPC_URL, "confirmed");

// Check existing
const existing = await connection.getAccountInfo(metadataPda);
if (existing) {
  console.log("Metadata account already exists!");
  process.exit(0);
}

const ix = new TransactionInstruction({
  programId: METADATA_PROGRAM,
  keys: [
    { pubkey: metadataPda, isSigner: false, isWritable: true },
    { pubkey: TOKEN_MINT, isSigner: false, isWritable: false },
    { pubkey: admin.publicKey, isSigner: true, isWritable: false },  // mint authority
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },   // payer
    { pubkey: admin.publicKey, isSigner: false, isWritable: false }, // update authority
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
  ],
  data,
});

console.log("\nSetting metadata:");
console.log("  Name:", NAME);
console.log("  Symbol:", SYMBOL);
console.log("  URI:", URI);

const tx = new Transaction().add(ix);
const sig = await sendAndConfirmTransaction(connection, tx, [admin]);
console.log("\nSUCCESS!");
console.log("TX:", sig);
console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
console.log("Token: https://explorer.solana.com/address/" + TOKEN_MINT.toBase58() + "?cluster=devnet");
