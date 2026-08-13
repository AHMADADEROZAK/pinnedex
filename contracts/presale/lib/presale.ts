import {
  createTransaction,
  signTransactionMessageWithSigners,
  getProgramDerivedAddress,
  getAddressEncoder,
  address,
  type Address,
  type TransactionSigner,
  type Rpc,
  type TransactionWithSigners,
} from "gill";
import type { SolanaConfig } from "./client.js";
import { createPresaleClient } from "./client.js";
import {
  PRESALE_PROGRAM_ID,
  SPINE_MINT,
  CONFIG_SEED,
  TOKEN_VAULT_SEED,
  VAULT_AUTHORITY_SEED,
  SOL_VAULT_SEED,
  VESTING_SEED,
  DISCRIMINATORS,
} from "./constants.js";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;
const SYSTEM_PROGRAM = "11111111111111111111111111111111" as Address;
const RENT_SYSVAR = "SysvarRent111111111111111111111111111111111" as Address;

const addrEncoder = getAddressEncoder();

function addrBytes(a: Address): Uint8Array {
  return addrEncoder.encode(a);
}

async function pda(programAddress: Address, seeds: (Uint8Array | string)[]): Promise<Address> {
  const [pdaAddr] = await getProgramDerivedAddress({ programAddress, seeds });
  return pdaAddr;
}

function encodeU64(val: bigint | number): Uint8Array {
  const buf = new Uint8Array(8);
  const v = BigInt(val);
  for (let i = 0; i < 8; i++) {
    buf[i] = Number((v >> BigInt(i * 8)) & 0xffn);
  }
  return buf;
}

function encodeI64(val: bigint | number): Uint8Array {
  return encodeU64(val);
}

export class PresaleClient {
  private rpc: Rpc;
  private sendAndConfirmTx: (tx: TransactionWithSigners) => Promise<string>;

  constructor(config?: SolanaConfig) {
    const client = createPresaleClient(config);
    this.rpc = client.rpc;
    this.sendAndConfirmTx = client.sendAndConfirmTransaction;
  }

  // ── PDA helpers ──

  async pdaConfig(authority: Address, tokenMint: Address): Promise<Address> {
    return pda(address(PRESALE_PROGRAM_ID), [
      CONFIG_SEED,
      addrBytes(authority),
      addrBytes(tokenMint),
    ]);
  }

  async pdaTokenVault(config: Address): Promise<Address> {
    return pda(address(PRESALE_PROGRAM_ID), [TOKEN_VAULT_SEED, addrBytes(config)]);
  }

  async pdaVaultAuthority(config: Address): Promise<Address> {
    return pda(address(PRESALE_PROGRAM_ID), [VAULT_AUTHORITY_SEED, addrBytes(config)]);
  }

  async pdaSolVault(config: Address): Promise<Address> {
    return pda(address(PRESALE_PROGRAM_ID), [SOL_VAULT_SEED, addrBytes(config)]);
  }

  async pdaVesting(config: Address, beneficiary: Address): Promise<Address> {
    return pda(address(PRESALE_PROGRAM_ID), [
      VESTING_SEED,
      addrBytes(config),
      addrBytes(beneficiary),
    ]);
  }

  // ── Instructions ──

  async initializePresale(
    authority: TransactionSigner,
    pricePerToken: bigint,
    saleStart: bigint,
    saleEnd: bigint,
    cliffDuration: bigint,
    vestingDuration: bigint,
    hardCapTokens: bigint,
  ) {
    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();
    const configPda = await this.pdaConfig(authority.address, address(SPINE_MINT));
    const tokenVault = await this.pdaTokenVault(configPda);
    const vaultAuthority = await this.pdaVaultAuthority(configPda);
    const solVault = await this.pdaSolVault(configPda);

    const data = new Uint8Array([
      ...DISCRIMINATORS.initializePresale,
      ...encodeU64(pricePerToken),
      ...encodeI64(saleStart),
      ...encodeI64(saleEnd),
      ...encodeI64(cliffDuration),
      ...encodeI64(vestingDuration),
      ...encodeU64(hardCapTokens),
    ]);

    const tx = createTransaction({
      version: "legacy",
      feePayer: authority,
      latestBlockhash,
      instructions: [
        {
          programAddress: address(PRESALE_PROGRAM_ID),
          data,
          accounts: [
            { address: authority.address, role: "WRITABLE", signer: true },
            { address: configPda, role: "WRITABLE" },
            { address: address(SPINE_MINT), role: "READABLE" },
            { address: tokenVault, role: "WRITABLE" },
            { address: vaultAuthority, role: "READABLE" },
            { address: solVault, role: "READABLE" },
            { address: address(TOKEN_PROGRAM), role: "READABLE" },
            { address: address(SYSTEM_PROGRAM), role: "READABLE" },
            { address: address(RENT_SYSVAR), role: "READABLE" },
          ],
        },
      ],
    });
    const signed = await signTransactionMessageWithSigners(tx);
    return this.sendAndConfirmTx(signed);
  }

  async depositTokens(
    authority: TransactionSigner,
    amount: bigint,
    authorityTokenAccount: Address,
  ) {
    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();
    const configPda = await this.pdaConfig(authority.address, address(SPINE_MINT));
    const tokenVault = await this.pdaTokenVault(configPda);

    const data = new Uint8Array([
      ...DISCRIMINATORS.depositTokens,
      ...encodeU64(amount),
    ]);

    const tx = createTransaction({
      version: "legacy",
      feePayer: authority,
      latestBlockhash,
      instructions: [
        {
          programAddress: address(PRESALE_PROGRAM_ID),
          data,
          accounts: [
            { address: authority.address, role: "WRITABLE", signer: true },
            { address: configPda, role: "WRITABLE" },
            { address: tokenVault, role: "WRITABLE" },
            { address: authorityTokenAccount, role: "WRITABLE" },
            { address: address(SPINE_MINT), role: "READABLE" },
            { address: address(TOKEN_PROGRAM), role: "READABLE" },
          ],
        },
      ],
    });
    const signed = await signTransactionMessageWithSigners(tx);
    return this.sendAndConfirmTx(signed);
  }

  async buyTokens(buyer: TransactionSigner, solAmount: bigint, authorityAddr: Address) {
    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();
    const configPda = await this.pdaConfig(authorityAddr, address(SPINE_MINT));
    const vestingPda = await this.pdaVesting(configPda, buyer.address);
    const solVault = await this.pdaSolVault(configPda);

    const data = new Uint8Array([
      ...DISCRIMINATORS.buyTokens,
      ...encodeU64(solAmount),
    ]);

    const tx = createTransaction({
      version: "legacy",
      feePayer: buyer,
      latestBlockhash,
      instructions: [
        {
          programAddress: address(PRESALE_PROGRAM_ID),
          data,
          accounts: [
            { address: buyer.address, role: "WRITABLE", signer: true },
            { address: configPda, role: "WRITABLE" },
            { address: vestingPda, role: "WRITABLE" },
            { address: solVault, role: "WRITABLE" },
            { address: address(SYSTEM_PROGRAM), role: "READABLE" },
          ],
        },
      ],
    });
    const signed = await signTransactionMessageWithSigners(tx);
    return this.sendAndConfirmTx(signed);
  }

  async claimTokens(
    beneficiary: TransactionSigner,
    beneficiaryTokenAccount: Address,
    authorityAddr: Address,
  ) {
    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();
    const configPda = await this.pdaConfig(authorityAddr, address(SPINE_MINT));
    const vestingPda = await this.pdaVesting(configPda, beneficiary.address);
    const tokenVault = await this.pdaTokenVault(configPda);
    const vaultAuthority = await this.pdaVaultAuthority(configPda);

    const tx = createTransaction({
      version: "legacy",
      feePayer: beneficiary,
      latestBlockhash,
      instructions: [
        {
          programAddress: address(PRESALE_PROGRAM_ID),
          data: DISCRIMINATORS.claimTokens,
          accounts: [
            { address: beneficiary.address, role: "WRITABLE", signer: true },
            { address: configPda, role: "READABLE" },
            { address: vestingPda, role: "WRITABLE" },
            { address: tokenVault, role: "WRITABLE" },
            { address: vaultAuthority, role: "READABLE" },
            { address: address(SPINE_MINT), role: "READABLE" },
            { address: beneficiaryTokenAccount, role: "WRITABLE" },
            { address: address(TOKEN_PROGRAM), role: "READABLE" },
            { address: address(SYSTEM_PROGRAM), role: "READABLE" },
            { address: address(RENT_SYSVAR), role: "READABLE" },
          ],
        },
      ],
    });
    const signed = await signTransactionMessageWithSigners(tx);
    return this.sendAndConfirmTx(signed);
  }
}
