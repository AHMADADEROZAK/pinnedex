"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export function RouteTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    if (open && pathname !== currentPathRef.current) {
      currentPathRef.current = pathname;
      const timer = window.setTimeout(() => setOpen(false), 150);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, open]);

  useEffect(() => {
    if (!open) return;
    const safety = window.setTimeout(() => setOpen(false), 8000);
    return () => window.clearTimeout(safety);
  }, [open]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!anchor?.href) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("href") === pathname) return;

      setOpen(true);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [pathname]);

  return (
    <>
      {children}
      <AnimatePresence>
        {open ? (
          <motion.div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src="/pinesuru.png"
              alt="Pinnedex"
              width={351}
              height={351}
              className="size-64 rounded-full shadow-lg animate-pulse"
            />
            <div className="relative rounded-2xl bg-[#F9B316] px-5 py-2.5 text-sm font-medium text-white">
              Please wait
              <span
                aria-hidden
                className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-[#F9B316]"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}