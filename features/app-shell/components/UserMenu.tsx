"use client";

import Link from "next/link";

import { UserButton, useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  if (userId) {
    return <UserButton />;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link href="/sign-in">Sign In</Link>}
    >
      Sign In
    </Button>
  );
}
