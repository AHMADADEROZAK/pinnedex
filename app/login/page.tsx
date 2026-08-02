import Link from "next/link";

import { Header } from "@/features/app-shell";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Login
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back.</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </main>
    </div>
  );
}
