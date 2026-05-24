import { requireAdmin } from "@/lib/auth/get-user";
import { SidebarAdmin } from "@/components/layout/sidebar-admin";
import { MobileNavAdmin } from "@/components/layout/mobile-nav-admin";
import { MobileHeaderAdmin } from "@/components/layout/mobile-header-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <SidebarAdmin user={{ full_name: profile.full_name, email: profile.email }} />
      <main className="flex-1 min-w-0 pb-24 lg:pb-12">
        <MobileHeaderAdmin />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 lg:py-12">{children}</div>
      </main>
      <MobileNavAdmin />
    </div>
  );
}
