'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';

export default function AdminContainersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [containers, setContainers] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const res = await adminAPI.getAllContainers();
      setContainers(res.data);
    } catch (error) {
      console.error('Failed to load containers:', error);
    }
  };

  const handleForceStop = async (id: string) => {
    if (!confirm('确定要强制停止此容器吗？')) return;
    try {
      await adminAPI.forceStopContainer(id);
      loadData();
    } catch (error) {
      console.error('Failed to stop container:', error);
    }
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  if (isLoggingOut) {
    return <LoadingBar text="退出中" />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <AdminSidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              容器管理
            </h2>
            <p className="text-on-surface-variant text-lg">
              监控和管理所有运行中的容器实例
            </p>
          </div>

          <div className="bg-surface-container-high rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">容器ID</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">用户</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">实验</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">创建时间</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">操作</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                    <td className="p-4 text-primary font-mono text-xs">{c.id.slice(0, 8)}</td>
                    <td className="p-4 text-on-surface-variant">{c.user?.displayName || c.user?.username}</td>
                    <td className="p-4 text-on-surface-variant">{c.lab?.title}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        c.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant text-xs">
                      {new Date(c.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="p-4">
                      {c.status === 'running' && (
                        <button
                          onClick={() => handleForceStop(c.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          强制停止
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
