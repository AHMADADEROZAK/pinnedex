"use client";

export function TradingChart({
  chainId,
  pairAddress,
  className,
}: {
  chainId: string;
  pairAddress: string;
  className?: string;
}) {
  const src = `https://dexscreener.com/embed/${encodeURIComponent(
    chainId,
  )}/${encodeURIComponent(pairAddress)}`;

  return (
    <iframe
      src={src}
      className={className ?? "h-[420px] w-full"}
      style={{ border: 0 }}
      loading="lazy"
      allow="clipboard-write"
      title={`${chainId}/${pairAddress} chart`}
    />
  );
}