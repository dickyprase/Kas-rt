import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AppSidebar from '@/components/app-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  return (
    <AppSidebar username={session.username || 'Admin'}>
      {children}
    </AppSidebar>
  );
}
