"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions/auth";

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <form action={logout}>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Logging out..." : "Logout"}
      </Button>
    </form>
  );
}
