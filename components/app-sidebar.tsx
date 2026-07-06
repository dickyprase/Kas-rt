'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from '@/app/components/ThemeToggle';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Download,
  Settings,
  Home,
  Coins,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/admin',
  },
  {
    title: 'Transaksi',
    icon: ArrowLeftRight,
    url: '/admin#transaksi',
  },
  {
    title: 'Backup',
    icon: Download,
    action: 'backup' as const,
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/admin#settings',
  },
  {
    title: 'Beranda',
    icon: Home,
    url: '/',
  },
];

export default function AppSidebar({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [backupLoading, setBackupLoading] = React.useState(false);

  async function handleBackup() {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Backup berhasil! File Excel sudah dikirim ke Telegram.');
      } else {
        toast.error(`Backup gagal: ${data.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Backup gagal: Network error');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Coins className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Kas App</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Admin Panel
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = Boolean(
                      item.url &&
                        pathname === item.url.split('#')[0] &&
                        !item.url.includes('#')
                    );
                    const isBackup =
                      'action' in item && item.action === 'backup';

                    return (
                      <SidebarMenuItem key={item.title}>
                        {isBackup ? (
                          <SidebarMenuButton
                            tooltip={item.title}
                            onClick={handleBackup}
                            disabled={backupLoading}
                          >
                            {backupLoading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <item.icon />
                            )}
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive}
                            render={<Link href={item.url!} />}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{username}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Administrator
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/admin" />}>
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
