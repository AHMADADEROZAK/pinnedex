import { ExternalLink, FileCode2, Coins, Vault, Landmark, FlaskConical } from "lucide-react";
import { PublicKey } from "@solana/web3.js";

import { presaleConfig } from "@/features/presale/config";
import { solanaNetworkName, isDevnet } from "@/features/solana";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function ContractDetails() {
  const programId = presaleConfig.programId;
  const tokenMint = presaleConfig.tokenMint;
  const adminWallet = presaleConfig.adminWallet;

  const programPubkey = new PublicKey(programId);
  const mintPubkey = new PublicKey(tokenMint);
  const adminPubkey = new PublicKey(adminWallet);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("presale"), adminPubkey.toBuffer(), mintPubkey.toBuffer()],
    programPubkey,
  );
  const [tokenVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_vault"), configPda.toBuffer()],
    programPubkey,
  );
  const [solVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("sol_vault"), configPda.toBuffer()],
    programPubkey,
  );

  const cluster =
    solanaNetworkName === "mainnet-beta" ? "" : `?cluster=${solanaNetworkName}`;

  const rows = [
    { icon: FileCode2, label: "Program", address: programId },
    { icon: Coins, label: "Token Mint", address: tokenMint },
    { icon: Landmark, label: "Config PDA", address: configPda.toBase58() },
    { icon: Vault, label: "Token Vault", address: tokenVault.toBase58() },
    { icon: Vault, label: "SOL Vault", address: solVault.toBase58() },
  ];

  return (
    <section className="flex flex-col gap-2 rounded-md border bg-card p-4">
      <h2 className="text-sm font-semibold tracking-tight">Contract Details</h2>
      <div className="flex flex-col gap-1.5 text-xs">
        {rows.map((row) => (
          <p key={row.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <row.icon className="size-3.5" />
              {row.label}
            </span>
            <a
              href={`https://explorer.solana.com/address/${row.address}${cluster}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-primary hover:underline"
            >
              <span className="truncate">{shortenAddress(row.address)}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </p>
        ))}
      </div>
      <p className="mt-1 rounded-md bg-muted/50 p-2 text-[10px] leading-relaxed text-muted-foreground">
        Vesting: 7-day cliff, then 30-day linear release. All transactions on-chain.
      </p>

      {isDevnet && (
        <div className="mt-1 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <p className="text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
            <span className="font-semibold">Devnet testing phase.</span> This
            contract is currently deployed on Solana Devnet for presale trial
            purposes. Tokens purchased during this phase are for testing only
            and hold no real value. Mainnet launch will be announced
            separately.
          </p>
        </div>
      )}
    </section>
  );
}
