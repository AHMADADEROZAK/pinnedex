import { HeartHandshake } from "lucide-react";

export function FeeCommitment() {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <HeartHandshake className="size-4 text-primary" />
        <p className="text-sm font-medium">Commitment to the community</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Every payment — whether for registration or login — is a commitment to
        the community. Fees go to the treasury, liquidity, and community
        initiatives, and keep the project genuinely engaged.
      </p>
    </div>
  );
}
