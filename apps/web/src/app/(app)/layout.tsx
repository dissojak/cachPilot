import NavSidebar from "@/components/nav-sidebar";
import { auth } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <>
      <NavSidebar email={session?.user?.email ?? null} name={session?.user?.name ?? null} />
      <div className="app-shell">{children}</div>
    </>
  );
}
