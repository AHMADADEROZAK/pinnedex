"use client";

import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <SignOutButton redirectUrl="/">
      <Button variant="outline" className={className}>
        Logout
      </Button>
    </SignOutButton>
  );
}
