"use client";

import { useState, useMemo } from "react";
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  findConfigPda,
  findVestingPda,
  findTokenVaultPda,
  findVaultAuthorityPda,
  getProgramId,
  SPINE_MINT,
  TOKEN_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
} from "@/features/presale/lib/pda";
import { presaleConfig, presaleRpcEndpoint } from "@/features/presale/config";

const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");

async function sha256Discriminator(name: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`global:${name}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash.slice(0, 8));
}

function findAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM,
  )[0];
}

/** CreateIdempotent instruction for the ATA program (no-op if ATA exists). */
function createAtaIdempotentIx(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM,
    data: Buffer.from([1]),
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
    ],
  });
}

export function ClaimButton({
  claimable,
  onClaimed,
}: {
  claimable: number;
  onClaimed?: () => void;
}) {
  const { publicKey, sendTransaction } = useWallet();
  const connection = useMemo(
    () => new Connection(presaleRpcEndpoint, "confirmed"),
    [],
  );
  const [pending, setPending] = useState(false);

  const programId = useMemo(() => getProgramId(), []);
  const adminWallet = useMemo(() => new PublicKey(presaleConfig.adminWallet), []);

  const handleClaim = async () => {
    if (!publicKey || !sendTransaction) return;
    setPending(true);
    try {
      const [configPda] = findConfigPda(adminWallet, programId);
      const [vestingPda] = findVestingPda(configPda, publicKey, programId);
      const [tokenVaultPda] = findTokenVaultPda(configPda, programId);
      const [vaultAuthorityPda] = findVaultAuthorityPda(configPda, programId);
      const beneficiaryAta = findAssociatedTokenAddress(publicKey, SPINE_MINT);

      const claimIx = new TransactionInstruction({
        programId,
        data: Buffer.from(await sha256Discriminator("claim_tokens")),
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPda, isSigner: false, isWritable: false },
          { pubkey: vestingPda, isSigner: false, isWritable: true },
          { pubkey: tokenVaultPda, isSigner: false, isWritable: true },
          { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
          { pubkey: SPINE_MINT, isSigner: false, isWritable: false },
          { pubkey: beneficiaryAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
        ],
      });

      const tx = new Transaction();

      // Auto-create SPINE ATA if missing (idempotent = safe if exists)
      const ataInfo = await connection.getAccountInfo(beneficiaryAta);
      if (!ataInfo) {
        tx.add(createAtaIdempotentIx(publicKey, beneficiaryAta, publicKey, SPINE_MINT));
      }

      tx.add(claimIx);

      const sig = await sendTransaction(tx, connection);
      toast.add({
        title: "Claim submitted",
        description: `TX: ${sig.slice(0, 8)}...`,
        type: "success",
      });
      onClaimed?.();
    } catch (err) {
      toast.add({
        title: "Claim failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button onClick={handleClaim} disabled={pending || claimable <= 0} className="gap-2">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Claim {claimable.toLocaleString()} SPINE
    </Button>
  );
}
