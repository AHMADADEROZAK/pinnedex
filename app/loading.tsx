import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Image
        src="/pinesuru.png"
        alt="Pinnedex"
        width={1536}
        height={1024}
        className="h-64 w-auto animate-pulse"
      />
      <div className="relative animate-in fade-in-0 zoom-in-95 rounded-2xl bg-[#F9B316] px-5 py-2.5 text-sm font-medium text-white">
        Please wait
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-[#F9B316]"
        />
      </div>
    </div>
  );
}