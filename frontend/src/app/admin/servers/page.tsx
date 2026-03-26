'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Plus, X, Server as ServerIcon, Activity, Cpu, HardDrive } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  status: string;
  maxContainers: number;
  activeContainers: number;
  cpuUsage: number;
  memoryUsage: number;
  cpuCores: number;
  cpuModel?: string;
  totalMemory: number;
  lastCheckAt: string;
  createdAt: string;
}

export default function ServersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [servers, setServers] = useState<Server[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [newServerToken, setNewServerToken] = useState<string | null>(null);
  const [selectedServerForContainers, setSelectedServerForContainers] = useState<string | null>(null);
  const [serverContainers, setServerContainers] = useState<any[]>([]);

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
      loadServers();
      // 每 1 秒刷新一次数据
      const interval = setInterval(loadServers, 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadServers = async () => {
    try {
      const { data } = await api.get('/servers');
      setServers(data);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/servers', formData);
      setNewServerToken(data.agentToken);
      loadServers();
    } catch (error: any) {
      alert(error.response?.data?.message || '添加服务器失败');
    }
  };

  const handleCloseTokenModal = () => {
    setNewServerToken(null);
    setShowAddModal(false);
    setFormData({
      name: '',
    });
  };

  const handleTest = async (id: string) => {
    try {
      const agent = servers.find(s => s.id === id);
      if (agent?.status === 'online') {
        alert('服务器在线！');
      } else {
        alert('服务器离线，请检查 Agent 是否运行');
      }
    } catch (error) {
      alert('测试失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这台服务器吗？')) return;
    
    try {
      await api.delete(`/servers/${id}`);
      loadServers();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const handleViewContainers = async (serverId: string) => {
    try {
      const { data } = await api.get(`/servers/${serverId}/containers`);
      setServerContainers(data.containers || []);
      setSelectedServerForContainers(serverId);
    } catch (error: any) {
      alert(error.response?.data?.message || '获取容器列表失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-500';
      case 'error': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'error': return '错误';
      case 'maintenance': return '维护中';
      default: return status;
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
              服务器管理
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理远程服务器，自动分配容器资源
            </p>
          </div>

          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加服务器
            </button>
          </div>

          {dataLoading ? (
            <div className="text-center py-12 text-on-surface-variant">加载中...</div>
          ) : (
            <div className="grid gap-6">
              {servers.map((server) => (
                <div key={server.id} className="bg-surface-container-high rounded-xl p-6 border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ServerIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-primary">{server.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${
                              server.status === 'online' ? 'bg-green-500' :
                              server.status === 'error' ? 'bg-red-500' :
                              server.status === 'maintenance' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`} />
                            <span className={`text-xs ${getStatusColor(server.status)}`}>
                              {getStatusText(server.status)}
                            </span>
                          </div>
                        </div>
                        {server.host && (
                          <p className="text-xs text-on-surface-variant font-mono">{server.host}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewContainers(server.id)}
                        disabled={server.status !== 'online'}
                        className="px-3 py-1.5 text-sm bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        查看容器
                      </button>
                      <button
                        onClick={() => handleTest(server.id)}
                        className="px-3 py-1.5 text-sm bg-surface-container text-on-surface-variant rounded-lg hover:bg-surface-bright transition-all"
                      >
                        测试连接
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-container rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <p className="text-xs text-on-surface-variant">容器数</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {server.status === 'online' ? server.activeContainers : '-'}
                      </p>
                    </div>
                    <div className="bg-surface-container rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <p className="text-xs text-on-surface-variant">CPU 使用率</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {server.status === 'online' ? `${server.cpuUsage.toFixed(1)}%` : '-'}
                      </p>
                    </div>
                    <div className="bg-surface-container rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-primary" />
                        <p className="text-xs text-on-surface-variant">内存使用率</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {server.status === 'online' ? `${server.memoryUsage.toFixed(1)}%` : '-'}
                      </p>
                    </div>
                    <div className="bg-surface-container rounded-lg p-4 relative group">
                      <div className="flex items-center gap-2 mb-2">
                        <ServerIcon className="w-4 h-4 text-primary" />
                        <p className="text-xs text-on-surface-variant">资源配置</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {server.status === 'online' 
                          ? `${server.cpuCores} 核 / ${server.totalMemory}MB`
                          : '等待 Agent 连接'}
                      </p>
                      {server.cpuModel && server.status === 'online' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-container-highest rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <p className="text-xs text-on-surface">{server.cpuModel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {servers.length === 0 && (
                <div className="text-center py-12 bg-surface-container-high rounded-xl">
                  <ServerIcon className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant">暂无服务器，点击上方按钮添加</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">添加服务器</h3>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">服务器名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="实验服务器1"
                />
                <p className="text-xs text-on-surface-variant mt-2">
                  服务器的硬件配置将在 Agent 连接后自动获取
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg hover:bg-surface-bright transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Token 显示模态框 */}
      {newServerToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">服务器创建成功！</h3>
              <button onClick={handleCloseTokenModal} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20">
                <p className="text-on-surface-variant text-sm">
                  请立即保存以下 Token，关闭后将无法再次查看
                </p>
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">Agent Token</label>
                <div className="bg-surface-container rounded-lg p-3 font-mono text-sm text-primary break-all">
                  {newServerToken}
                </div>
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">安装命令（在远程服务器上执行）</label>
                <div className="bg-surface-container rounded-lg p-3 font-mono text-xs text-on-surface overflow-x-auto">
                  <code>
                    curl -fsSL {window.location.origin.replace('3000', '3001')}/agent/install.sh | bash -s -- {window.location.origin.replace('3000', '3001')} {newServerToken} {formData.name.replace(/\s+/g, '-')}
                  </code>
                </div>
              </div>

              <div className="space-y-2 text-sm text-on-surface-variant">
                <p className="font-semibold text-primary">安装步骤：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>SSH 登录到远程服务器</li>
                  <li>确保已安装 Docker</li>
                  <li>复制上方命令并执行</li>
                  <li>等待安装完成，Agent 将自动连接</li>
                  <li>返回此页面查看服务器状态</li>
                </ol>
              </div>

              <button
                onClick={handleCloseTokenModal}
                className="w-full bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-all"
              >
                我已保存，关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 容器列表模态框 */}
      {selectedServerForContainers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">
                服务器容器列表 - {servers.find(s => s.id === selectedServerForContainers)?.name}
              </h3>
              <button onClick={() => setSelectedServerForContainers(null)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-surface-container rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-highest border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">容器 ID</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">名称</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">镜像</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">状态</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">端口</th>
                  </tr>
                </thead>
                <tbody>
                  {serverContainers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        该服务器上暂无容器
                      </td>
                    </tr>
                  ) : (
                    serverContainers.map((container) => (
                      <tr key={container.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                        <td className="p-4 text-primary font-mono text-xs">{container.id.slice(0, 12)}</td>
                        <td className="p-4 text-on-surface">{container.name}</td>
                        <td className="p-4 text-on-surface-variant text-sm">{container.image}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            container.status === 'running' ? 'bg-green-500/20 text-green-400' :
                            container.status === 'exited' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {container.status}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant text-xs">
                          {Object.entries(container.ports || {}).map(([port, bindings]: [string, any]) => (
                            bindings && bindings[0] ? (
                              <div key={port}>
                                {port} → {bindings[0].HostPort}
                              </div>
                            ) : null
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleViewContainers(selectedServerForContainers)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all"
              >
                刷新列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
