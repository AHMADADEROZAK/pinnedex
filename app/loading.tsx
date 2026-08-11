import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Image
        src="/pinesuru.png"
        alt="Pinnedex"
        width={351}
        height={351}
        className="size-64 animate-pulse rounded-full shadow-lg"
      />
      <div className="relative animate-in fade-in-0 zoom-in-95 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        Please wait
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-primary"
        />
      </div>
    </div>
  );
}