"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <form action={logout} className="w-full">
      <Button type="submit" variant="outline" className={className} disabled={pending}>
        {pending ? "Logging out..." : "Logout"}
      </Button>
    </form>
  );
}
