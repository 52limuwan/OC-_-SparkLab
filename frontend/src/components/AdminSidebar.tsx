'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Container, LogOut, Settings, Server, Disc } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserAvatarOrInitial } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import LoadingBar from './LoadingBar';

const adminNavItems = [
  { icon: LayoutDashboard, label: '统计概览', href: '/admin' },
  { icon: Users, label: '用户管理', href: '/admin/users' },
  { icon: BookOpen, label: '课程管理', href: '/admin/courses' },
  { icon: Server, label: '服务器管理', href: '/admin/servers' },
  { icon: Container, label: '容器管理', href: '/admin/containers' },
  { icon: Disc, label: '镜像管理', href: '/admin/images' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoggingOut) {
    return <LoadingBar text="退出中" />;
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 font-headline tracking-tight text-sm z-50 border-r border-outline-variant/10">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold tracking-tighter text-primary">星火实验室</h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
          管理员控制台
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {adminNavItems.map((item) => {
          let isActive = false;
          if (item.href === '/admin') {
            isActive = pathname === '/admin';
          } else {
            isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2.5 flex items-center gap-3 transition-colors rounded-lg',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-6 border-t border-outline-variant/10 px-2">
        <Link
          href="/admin/settings"
          className="text-on-surface-variant hover:text-primary px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-surface-container-high/50 rounded-lg"
        >
          <Settings className="w-4 h-4" />
          系统设置
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-on-surface-variant hover:text-error px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-surface-container-high/50 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>

        {user && (
          <div className="mx-2 mt-4 flex items-center gap-3 px-2 py-3 rounded-xl bg-surface-container">
            {(() => {
              const avatar = getUserAvatarOrInitial(user);
              return avatar.type === 'image' ? (
                <img 
                  src={avatar.value} 
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {avatar.value}
                </div>
              );
            })()}
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-primary truncate">{user.displayName}</p>
              <p className="text-[10px] text-on-surface-variant truncate">管理员</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
