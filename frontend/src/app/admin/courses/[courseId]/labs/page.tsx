'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI, courseAPI, labAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Edit, Trash2, Plus, X, BookOpen, Server, Disc, Settings, Terminal, Database, HardDrive } from 'lucide-react';
import api from '@/lib/api';

interface ServerInfo {
  id: string;
  name: string;
  status: string;
}

interface DockerImage {
  id: string;
  tags: string[];
}

interface PortMapping {
  containerPort: number;
  hostPort?: number;
  protocol: 'tcp' | 'udp';
  random: boolean;
}

interface EnvironmentVar {
  name: string;
  value: string;
}

interface VolumeMount {
  hostPath: string;
  containerPath: string;
  mode: 'ro' | 'rw';
}

export default function AdminCourseLabsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  
  const [portMappings, setPortMappings] = useState<PortMapping[]>([]);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVar[]>([]);
  const [volumeMounts, setVolumeMounts] = useState<VolumeMount[]>([]);

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
    if (isAuthenticated && user?.role === 'ADMIN' && courseId) {
      loadCourse();
      loadLabs(courseId);
      loadServers();
    }
  }, [isAuthenticated, user, courseId]);

  useEffect(() => {
    if (selectedServer) {
      loadImages();
    }
  }, [selectedServer]);

  const loadCourse = async () => {
    try {
      const res = await courseAPI.getOne(courseId);
      setSelectedCourse(res.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const loadLabs = async (courseId: string) => {
    try {
      const res = await labAPI.getByCourse(courseId);
      setLabs(res.data);
    } catch (error) {
      console.error('Failed to load labs:', error);
    }
  };

  const loadServers = async () => {
    try {
      const { data } = await api.get('/servers');
      const onlineServers = data.filter((s: ServerInfo) => s.status === 'online');
      setServers(onlineServers);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadImages = async () => {
    if (!selectedServer) return;
    try {
      const { data } = await api.get(`/servers/${selectedServer}/images`);
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const handleStartEdit = (lab: any) => {
    setEditingLab(lab);
    if (lab.serverId) {
      setSelectedServer(lab.serverId);
    }
    setPortMappings(lab.portMappings ? JSON.parse(lab.portMappings) : []);
    setEnvironmentVars(lab.environmentVars ? JSON.parse(lab.environmentVars) : []);
    setVolumeMounts(lab.volumeMounts ? JSON.parse(lab.volumeMounts) : []);
  };

  const handleCancelEdit = () => {
    setEditingLab(null);
    setSelectedServer('');
    setImages([]);
    setPortMappings([]);
    setEnvironmentVars([]);
    setVolumeMounts([]);
  };

  const handleSaveLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      courseId: courseId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      difficulty: formData.get('difficulty') as string,
      order: parseInt(formData.get('order') as string),
      points: parseInt(formData.get('points') as string),
      timeLimit: parseInt(formData.get('timeLimit') as string) || 60,
      serverId: formData.get('serverId') as string || null,
      dockerImage: formData.get('dockerImage') as string,
      cpuLimit: parseFloat(formData.get('cpuLimit') as string),
      memoryLimit: parseInt(formData.get('memoryLimit') as string),
      startupCommand: formData.get('startupCommand') as string || null,
      shellCommand: formData.get('shellCommand') as string || '/bin/bash',
      restartPolicy: formData.get('restartPolicy') as string,
      portMappings,
      environmentVars,
      volumeMounts,
    };

    console.log('Saving lab with data:', data);

    try {
      if (editingLab && editingLab.id) {
        await adminAPI.updateLab(editingLab.id, data);
      } else {
        await adminAPI.createLab(data);
      }
      handleCancelEdit();
      await loadLabs(courseId);
    } catch (error: any) {
      console.error('Failed to save lab:', error);
      const errorMessage = error.response?.data?.message || error.message || '未知错误';
      alert(`保存失败: ${errorMessage}`);
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm('确定要删除此实验吗？')) return;
    try {
      await adminAPI.deleteLab(id);
      await loadLabs(courseId);
    } catch (error) {
      console.error('Failed to delete lab:', error);
      alert('删除失败，请重试');
    }
  };

  const addPortMapping = () => {
    setPortMappings([...portMappings, {
      containerPort: 80,
      hostPort: 8080,
      protocol: 'tcp',
      random: false
    }]);
  };

  const removePortMapping = (index: number) => {
    setPortMappings(portMappings.filter((_, i) => i !== index));
  };

  const updatePortMapping = (index: number, field: keyof PortMapping, value: any) => {
    const updated = [...portMappings];
    updated[index] = { ...updated[index], [field]: value };
    setPortMappings(updated);
  };

  const addEnvironmentVar = () => {
    setEnvironmentVars([...environmentVars, { name: '', value: '' }]);
  };

  const removeEnvironmentVar = (index: number) => {
    setEnvironmentVars(environmentVars.filter((_, i) => i !== index));
  };

  const updateEnvironmentVar = (index: number, field: keyof EnvironmentVar, value: string) => {
    const updated = [...environmentVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvironmentVars(updated);
  };

  const addVolumeMount = () => {
    setVolumeMounts([...volumeMounts, { hostPath: '', containerPath: '', mode: 'rw' }]);
  };

  const removeVolumeMount = (index: number) => {
    setVolumeMounts(volumeMounts.filter((_, i) => i !== index));
  };

  const updateVolumeMount = (index: number, field: keyof VolumeMount, value: string) => {
    const updated = [...volumeMounts];
    updated[index] = { ...updated[index], [field]: value as any };
    setVolumeMounts(updated);
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
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/admin/courses')}
                className="text-on-surface-variant hover:text-primary"
              >
                ← 返回课程管理
              </button>
            </div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              管理实验
            </h2>
            <p className="text-on-surface-variant text-lg">
              {selectedCourse ? selectedCourse.title : '加载中...'} - 共 {labs.length} 个实验
            </p>
          </div>

          {!editingLab ? (
            <>
              <div className="mb-4">
                <button
                  onClick={() => {
                    setEditingLab({});
                    setSelectedServer('');
                    setImages([]);
                    setPortMappings([]);
                    setEnvironmentVars([]);
                    setVolumeMounts([]);
                  }}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新建实验
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {labs.map((lab: any, index: number) => (
                  <div key={lab.id} className="bg-surface-container-high rounded-xl p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {lab.order || index + 1}
                        </div>
                        <h4 className="text-lg font-bold text-primary flex-1 pr-2">{lab.title}</h4>
                      </div>
                    </div>
                    
                    <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 flex-grow">
                      {lab.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4 pb-4 border-b border-white/10">
                      <span>
                        {lab.difficulty === 'beginner' ? '入门' : lab.difficulty === 'intermediate' ? '进阶' : '高级'}
                      </span>
                      <span>{lab.points} 分</span>
                      {lab.serverId && <span>服务器已绑定</span>}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStartEdit(lab)}
                          className="bg-surface-container text-primary px-2 py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-1 text-xs"
                          title="编辑实验"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">编辑</span>
                        </button>
                        <button
                          onClick={() => handleDeleteLab(lab.id)}
                          className="bg-red-500/20 text-red-400 px-2 py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-1 text-xs"
                          title="删除实验"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">删除</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {labs.length === 0 && (
                  <div className="text-center py-12 text-on-surface-variant">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>该课程暂无实验</p>
                    <p className="text-sm mt-2">点击上方"新建实验"按钮添加</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface-container-high rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-primary">
                  {editingLab.id ? '编辑实验' : '新建实验'}
                </h3>
                <button onClick={handleCancelEdit} className="text-on-surface-variant hover:text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveLab} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-on-surface-variant mb-2">实验名称 *</label>
                    <input
                      name="title"
                      defaultValue={editingLab.title || ''}
                      required
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-on-surface-variant mb-2">实验描述</label>
                    <textarea
                      name="description"
                      defaultValue={editingLab.description || ''}
                      rows={2}
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-on-surface-variant mb-2">实验内容（Markdown）</label>
                    <textarea
                      name="content"
                      defaultValue={editingLab.content || ''}
                      rows={6}
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-on-surface-variant mb-2">排序 *</label>
                    <input
                      name="order"
                      type="number"
                      defaultValue={editingLab.order || labs.length + 1}
                      required
                      min="1"
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-on-surface-variant mb-2">难度 *</label>
                    <select
                      name="difficulty"
                      defaultValue={editingLab.difficulty || 'beginner'}
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="beginner">入门</option>
                      <option value="intermediate">进阶</option>
                      <option value="advanced">高级</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-on-surface-variant mb-2">分数 *</label>
                    <input
                      name="points"
                      type="number"
                      defaultValue={editingLab.points || 100}
                      required
                      min="1"
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-on-surface-variant mb-2">时间限制（分钟）</label>
                    <input
                      name="timeLimit"
                      type="number"
                      defaultValue={editingLab.timeLimit || 60}
                      min="1"
                      className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    容器配置
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">选择服务器</label>
                      <select
                        name="serverId"
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">不指定服务器（自动分配）</option>
                        {servers.map(server => (
                          <option key={server.id} value={server.id}>
                            {server.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">Docker 镜像 *</label>
                      {selectedServer ? (
                        <select
                          name="dockerImage"
                          defaultValue={editingLab.dockerImage || ''}
                          required
                          className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {images.length === 0 ? (
                            <option value="">该服务器暂无镜像</option>
                          ) : (
                            images.map((img) => (
                              <option key={img.id} value={img.tags?.[0] || img.id.slice(0, 12)}>
                                {img.tags?.[0] || img.id.slice(0, 12)}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <input
                          name="dockerImage"
                          defaultValue={editingLab.dockerImage || 'ubuntu:22.04'}
                          required
                          placeholder="ubuntu:22.04"
                          className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">CPU 限制（核） *</label>
                      <input
                        name="cpuLimit"
                        type="number"
                        step="0.1"
                        defaultValue={editingLab.cpuLimit || 1.0}
                        required
                        min="0.1"
                        max="16"
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">内存限制（MB） *</label>
                      <input
                        name="memoryLimit"
                        type="number"
                        defaultValue={editingLab.memoryLimit || 512}
                        required
                        min="128"
                        step="128"
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">容器启动命令</label>
                      <input
                        name="startupCommand"
                        defaultValue={editingLab.startupCommand || ''}
                        placeholder="/usr/sbin/sshd -D"
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">进入容器的 Bash 命令</label>
                      <input
                        name="shellCommand"
                        defaultValue={editingLab.shellCommand || '/bin/bash'}
                        placeholder="/bin/bash"
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-on-surface-variant mb-2">重启策略</label>
                      <select
                        name="restartPolicy"
                        defaultValue={editingLab.restartPolicy || 'unless-stopped'}
                        className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="no">不重启</option>
                        <option value="always">始终重启</option>
                        <option value="unless-stopped">除非停止</option>
                        <option value="on-failure">失败时重启</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                      <Terminal className="w-5 h-5" />
                      端口映射
                    </h4>
                    <button
                      type="button"
                      onClick={addPortMapping}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm hover:bg-primary/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加端口
                    </button>
                  </div>

                  {portMappings.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">暂未配置端口映射</p>
                  ) : (
                    <div className="space-y-3">
                      {portMappings.map((pm, index) => (
                        <div key={index} className="flex gap-3 items-center bg-surface-container p-3 rounded-lg">
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">容器端口</label>
                            <input
                              type="number"
                              value={pm.containerPort}
                              onChange={(e) => updatePortMapping(index, 'containerPort', parseInt(e.target.value))}
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">主机端口</label>
                            <input
                              type="number"
                              value={pm.hostPort || ''}
                              disabled={pm.random}
                              onChange={(e) => updatePortMapping(index, 'hostPort', parseInt(e.target.value))}
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-on-surface-variant mb-1 block">协议</label>
                            <select
                              value={pm.protocol}
                              onChange={(e) => updatePortMapping(index, 'protocol', e.target.value)}
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            >
                              <option value="tcp">TCP</option>
                              <option value="udp">UDP</option>
                            </select>
                          </div>
                          <div className="w-24 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pm.random}
                              onChange={(e) => updatePortMapping(index, 'random', e.target.checked)}
                              className="w-4 h-4 text-primary"
                              id={`random-${index}`}
                            />
                            <label htmlFor={`random-${index}`} className="text-xs text-on-surface-variant">随机</label>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePortMapping(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      环境变量
                    </h4>
                    <button
                      type="button"
                      onClick={addEnvironmentVar}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm hover:bg-primary/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加变量
                    </button>
                  </div>

                  {environmentVars.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">暂未配置环境变量</p>
                  ) : (
                    <div className="space-y-3">
                      {environmentVars.map((ev, index) => (
                        <div key={index} className="flex gap-3 items-center bg-surface-container p-3 rounded-lg">
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">变量名</label>
                            <input
                              type="text"
                              value={ev.name}
                              onChange={(e) => updateEnvironmentVar(index, 'name', e.target.value)}
                              placeholder="MYSQL_ROOT_PASSWORD"
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">变量值</label>
                            <input
                              type="text"
                              value={ev.value}
                              onChange={(e) => updateEnvironmentVar(index, 'value', e.target.value)}
                              placeholder="123456"
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEnvironmentVar(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      卷挂载
                    </h4>
                    <button
                      type="button"
                      onClick={addVolumeMount}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm hover:bg-primary/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加挂载
                    </button>
                  </div>

                  {volumeMounts.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">暂未配置卷挂载</p>
                  ) : (
                    <div className="space-y-3">
                      {volumeMounts.map((vm, index) => (
                        <div key={index} className="flex gap-3 items-center bg-surface-container p-3 rounded-lg">
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">主机路径</label>
                            <input
                              type="text"
                              value={vm.hostPath}
                              onChange={(e) => updateVolumeMount(index, 'hostPath', e.target.value)}
                              placeholder="/mydata/mysql/data"
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-on-surface-variant mb-1 block">容器路径</label>
                            <input
                              type="text"
                              value={vm.containerPath}
                              onChange={(e) => updateVolumeMount(index, 'containerPath', e.target.value)}
                              placeholder="/var/lib/mysql"
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-on-surface-variant mb-1 block">权限</label>
                            <select
                              value={vm.mode}
                              onChange={(e) => updateVolumeMount(index, 'mode', e.target.value)}
                              className="w-full bg-surface-bright text-on-surface px-2 py-1 rounded text-sm"
                            >
                              <option value="rw">读写</option>
                              <option value="ro">只读</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVolumeMount(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg hover:bg-surface-bright transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                  >
                    保存实验
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
