import Link from "next/link";

import { Header } from "@/features/app-shell";
import { RegisterForm, FeeCommitment } from "@/features/auth";
import { presaleConfig } from "@/features/presale";

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Create account
          </h1>
          <FeeCommitment />
        </div>
        <RegisterForm
          feeSol={presaleConfig.registrationFeeSol}
          collectionWallet={presaleConfig.collectionWallet}
        />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
