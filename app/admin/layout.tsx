import { Header } from "@/features/app-shell";
import { AdminSidebar } from "@/features/admin";
import { requireAdmin } from "@/lib/dal";
import { adminBasePath } from "@/lib/admin-path";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar basePath={adminBasePath()} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
