import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminSidebarLayout from './AdminSidebarLayout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  return (
    <AdminSidebarLayout username={session.username || 'Admin'}>
      {children}
    </AdminSidebarLayout>
  );
}
