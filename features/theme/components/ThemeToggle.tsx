"use client";

import { Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled
      aria-label="Dark theme"
      title="Dark theme"
    >
      <Moon className="size-4" />
    </Button>
  );
}