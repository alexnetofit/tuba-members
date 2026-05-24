import { getCurrentUser } from "@/lib/auth/get-user";
import { SidebarAluno } from "@/components/layout/sidebar-aluno";
import { MobileNavAluno } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <SidebarAluno
        user={{
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
        }}
      />
      <main className="flex-1 min-w-0 pb-24 lg:pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-8 lg:py-12">{children}</div>
      </main>
      <MobileNavAluno role={profile.role} />
    </div>
  );
}
