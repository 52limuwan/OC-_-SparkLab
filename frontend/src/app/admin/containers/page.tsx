'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI } from '@/lib/api';
import api from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Server, Filter } from 'lucide-react';

interface ServerInfo {
  id: string;
  name: string;
  status: string;
}

export default function AdminContainersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [containers, setContainers] = useState<any[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('all');

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
      loadServers();
      // 每 2 秒刷新一次
      const interval = setInterval(() => {
        loadData();
        loadServers();
      }, 2000);
      return () => clearInterval(interval);
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

  const loadServers = async () => {
    try {
      const { data } = await api.get('/servers');
      setServers(data);
    } catch (error) {
      console.error('Failed to load servers:', error);
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

  const filteredContainers = selectedServer === 'all' 
    ? containers 
    : containers.filter(c => c.serverId === selectedServer);

  const getServerName = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    return server?.name || '未知服务器';
  };

  const getServerStatus = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    return server?.status || 'offline';
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
              监控和管理所有服务器上的容器实例
            </p>
          </div>

          {/* 服务器筛选器 */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Filter className="w-5 h-5" />
              <span className="text-sm">筛选服务器：</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedServer('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedServer === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                全部 ({containers.length})
              </button>
              {servers.map(server => (
                <button
                  key={server.id}
                  onClick={() => setSelectedServer(server.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    selectedServer === server.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-bright'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    server.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  {server.name} ({containers.filter(c => c.serverId === server.id).length})
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-high rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">容器ID</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">服务器</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">用户</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">实验</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">创建时间</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredContainers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                      暂无容器
                    </td>
                  </tr>
                ) : (
                  filteredContainers.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                      <td className="p-4 text-primary font-mono text-xs">{c.id.slice(0, 8)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-primary" />
                          <span className="text-on-surface">{getServerName(c.serverId)}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            getServerStatus(c.serverId) === 'online' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{c.user?.displayName || c.user?.username}</td>
                      <td className="p-4 text-on-surface-variant">{c.lab?.title}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          c.status === 'running' ? 'bg-green-500/20 text-green-400' : 
                          c.status === 'creating' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-surface-container text-on-surface-variant'
                        }`}>
                          {c.status === 'running' ? '运行中' :
                           c.status === 'creating' ? '创建中' :
                           c.status === 'stopped' ? '已停止' : c.status}
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 统计信息 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">总容器数</p>
              <p className="text-2xl font-bold text-primary">{containers.length}</p>
            </div>
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">运行中</p>
              <p className="text-2xl font-bold text-green-400">
                {containers.filter(c => c.status === 'running').length}
              </p>
            </div>
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">在线服务器</p>
              <p className="text-2xl font-bold text-primary">
                {servers.filter(s => s.status === 'online').length} / {servers.length}
              </p>
            </div>
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">创建中</p>
              <p className="text-2xl font-bold text-blue-400">
                {containers.filter(c => c.status === 'creating').length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
