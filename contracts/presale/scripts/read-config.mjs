import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const configPda = new PublicKey("2wgFAkyxaa1cEdEnzZ1SxP3yQp5thVzFYYbqT7RpeueW");

const acc = await connection.getAccountInfo(configPda);
if (!acc) { console.log("not found"); process.exit(1); }

const d = acc.data;
console.log("total len:", d.length);

// discriminator 8 bytes (0-8)
// authority 32 (8-40)
// token_mint 32 (40-72)
// price_per_token u64 @72
// sale_start i64 @80
// sale_end i64 @88
// cliff_duration i64 @96
// vesting_duration i64 @104
// hard_cap_tokens u64 @112
// tokens_sold u64 @120
// is_finalized bool @128
// bump u8 @129

console.log("authority:", new PublicKey(d.subarray(8, 40)).toBase58());
console.log("token_mint:", new PublicKey(d.subarray(40, 72)).toBase58());
console.log("price_per_token:", Number(d.readBigUInt64LE(72)));
console.log("sale_start:", new Date(Number(d.readBigInt64LE(80)) * 1000).toISOString());
console.log("sale_end:", new Date(Number(d.readBigInt64LE(88)) * 1000).toISOString());
console.log("cliff_duration:", Number(d.readBigInt64LE(96)), "s =", Number(d.readBigInt64LE(96)) / 86400, "days");
console.log("vesting_duration:", Number(d.readBigInt64LE(104)), "s =", Number(d.readBigInt64LE(104)) / 86400, "days");
console.log("hard_cap_tokens:", Number(d.readBigUInt64LE(112)));
console.log("tokens_sold:", Number(d.readBigUInt64LE(120)));
console.log("is_finalized:", d[128]);
console.log("bump:", d[129]);
