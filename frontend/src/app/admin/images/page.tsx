'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Server, Image as ImageIcon, Download, Trash2, Plus, FileCode, Layers } from 'lucide-react';

interface ServerInfo {
  id: string;
  name: string;
  status: string;
}

interface DockerImage {
  id: string;
  tags: string[];
  size: number;
  created: string;
  serverId?: string;
  serverName?: string;
}

export default function AdminImagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [images, setImages] = useState<DockerImage[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [showPullModal, setShowPullModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [pullImageName, setPullImageName] = useState('');
  const [pullTag, setPullTag] = useState('latest');
  const [buildImageName, setBuildImageName] = useState('');
  const [buildTag, setBuildTag] = useState('latest');
  const [dockerfile, setDockerfile] = useState('FROM ubuntu:latest\nRUN apt-get update\nCMD ["/bin/bash"]');
  const [composeContent, setComposeContent] = useState('version: "3"\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - "80:80"');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

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
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedServer) {
      loadImages();
    }
  }, [selectedServer]);

  const loadServers = async () => {
    try {
      const { data } = await api.get('/servers');
      const onlineServers = data.filter((s: ServerInfo) => s.status === 'online');
      setServers(onlineServers);
      if (onlineServers.length > 0 && !selectedServer) {
        setSelectedServer(onlineServers[0].id);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadImages = async () => {
    if (!selectedServer) return;
    
    try {
      const { data } = await api.get(`/servers/${selectedServer}/images`);
      const server = servers.find(s => s.id === selectedServer);
      const formattedImages = (data.images || []).map((img: any) => ({
        ...img,
        serverId: selectedServer,
        serverName: server?.name,
      }));
      setImages(formattedImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const handlePullImage = async () => {
    if (!pullImageName || !selectedServer) return;
    
    setLoading(true);
    try {
      await api.post(`/servers/${selectedServer}/images/pull`, {
        imageName: pullImageName,
        tag: pullTag,
      });
      alert('镜像拉取成功！');
      setShowPullModal(false);
      setPullImageName('');
      setPullTag('latest');
      loadImages();
    } catch (error: any) {
      alert(`拉取镜像失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildImage = async () => {
    if (!buildImageName || !dockerfile || !selectedServer) return;
    
    setLoading(true);
    try {
      await api.post(`/servers/${selectedServer}/images/build`, {
        dockerfile,
        imageName: buildImageName,
        tag: buildTag,
      });
      alert('镜像构建成功！');
      setShowBuildModal(false);
      setBuildImageName('');
      setBuildTag('latest');
      loadImages();
    } catch (error: any) {
      alert(`构建镜像失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('确定要删除此镜像吗？')) return;
    
    try {
      await api.delete(`/servers/${selectedServer}/images/${imageId}`);
      loadImages();
    } catch (error: any) {
      alert(`删除镜像失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
              镜像管理
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理服务器上的 Docker 镜像、Dockerfile 和 Compose
            </p>
          </div>

          {/* 服务器选择和操作按钮 */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <label className="text-sm text-on-surface-variant">选择服务器：</label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
              >
                {servers.map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPullModal(true)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                disabled={!selectedServer}
              >
                <Download className="w-4 h-4" />
                拉取镜像
              </button>
              <button
                onClick={() => setShowBuildModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                disabled={!selectedServer}
              >
                <FileCode className="w-4 h-4" />
                构建镜像
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2"
                disabled={!selectedServer}
              >
                <Layers className="w-4 h-4" />
                Compose
              </button>
            </div>
          </div>

          {/* 镜像列表 */}
          <div className="bg-surface-container-high rounded-xl overflow-hidden">
            <table className="w-full">
              <colgroup>
                <col style={{ width: '15%', minWidth: '120px' }} />
                <col style={{ width: '35%', minWidth: '200px' }} />
                <col style={{ width: '15%', minWidth: '100px' }} />
                <col style={{ width: '20%', minWidth: '150px' }} />
                <col style={{ width: '15%', minWidth: '100px' }} />
              </colgroup>
              <thead className="bg-surface-container border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-on-surface-variant">镜像ID</th>
                  <th className="text-left p-3 text-sm font-medium text-on-surface-variant">标签</th>
                  <th className="text-left p-3 text-sm font-medium text-on-surface-variant">大小</th>
                  <th className="text-left p-3 text-sm font-medium text-on-surface-variant">创建时间</th>
                  <th className="text-left p-3 text-sm font-medium text-on-surface-variant">操作</th>
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                      {selectedServer ? '暂无镜像' : '请选择服务器'}
                    </td>
                  </tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                      <td className="p-3">
                        <span className="text-primary font-mono text-xs block truncate" title={img.id}>
                          {img.id.replace('sha256:', '').slice(0, 12)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {img.tags && img.tags.length > 0 ? (
                            img.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-on-surface-variant text-xs">&lt;none&gt;</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-on-surface-variant text-sm">{formatSize(img.size)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-on-surface-variant text-xs">
                          {new Date(img.created).toLocaleString('zh-CN', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveImage(img.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 统计信息 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">总镜像数</p>
              <p className="text-2xl font-bold text-primary">{images.length}</p>
            </div>
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">总大小</p>
              <p className="text-2xl font-bold text-blue-400">
                {formatSize(images.reduce((sum, img) => sum + img.size, 0))}
              </p>
            </div>
            <div className="bg-surface-container-high rounded-lg p-4">
              <p className="text-xs text-on-surface-variant mb-1">在线服务器</p>
              <p className="text-2xl font-bold text-green-400">{servers.length}</p>
            </div>
          </div>
        </div>
      </main>

      {/* 拉取镜像模态框 */}
      {showPullModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-primary mb-4">拉取镜像</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">镜像名称</label>
                <input
                  type="text"
                  value={pullImageName}
                  onChange={(e) => setPullImageName(e.target.value)}
                  placeholder="例如: nginx, ubuntu, mysql"
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">标签</label>
                <input
                  type="text"
                  value={pullTag}
                  onChange={(e) => setPullTag(e.target.value)}
                  placeholder="latest"
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handlePullImage}
                  disabled={loading || !pullImageName}
                  className="flex-1 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {loading ? '拉取中...' : '拉取'}
                </button>
                <button
                  onClick={() => setShowPullModal(false)}
                  className="flex-1 py-2 bg-surface-container text-on-surface rounded-lg hover:bg-surface-bright transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 构建镜像模态框 */}
      {showBuildModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">构建镜像</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">镜像名称</label>
                <input
                  type="text"
                  value={buildImageName}
                  onChange={(e) => setBuildImageName(e.target.value)}
                  placeholder="例如: myapp"
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">标签</label>
                <input
                  type="text"
                  value={buildTag}
                  onChange={(e) => setBuildTag(e.target.value)}
                  placeholder="latest"
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">Dockerfile</label>
                <textarea
                  value={dockerfile}
                  onChange={(e) => setDockerfile(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary font-mono text-sm"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleBuildImage}
                  disabled={loading || !buildImageName || !dockerfile}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {loading ? '构建中...' : '构建'}
                </button>
                <button
                  onClick={() => setShowBuildModal(false)}
                  className="flex-1 py-2 bg-surface-container text-on-surface rounded-lg hover:bg-surface-bright transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose 模态框 */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">Docker Compose</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如: myproject"
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">docker-compose.yml</label>
                <textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 bg-surface-container text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary font-mono text-sm"
                />
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  注意：Docker Compose 功能需要在服务器上安装 docker-compose 工具
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="flex-1 py-2 bg-surface-container text-on-surface rounded-lg hover:bg-surface-bright transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
