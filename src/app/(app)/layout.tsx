import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // middleware already guarantees a session exists for everything under this group
  const user = session!.user;

  return <AppShell user={user}>{children}</AppShell>;
}
