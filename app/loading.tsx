import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
<Image
        src="/pinesuru.png"
        alt="Pinnedex"
        width={1536}
        height={1024}
        className="h-64 w-auto"
      />
      <div className="loading-dots" role="status" aria-label="Loading">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}