import { hasActiveMembership } from "@/features/signal/lib/membership";

export async function MemberGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const active = await hasActiveMembership();

  if (!active) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}