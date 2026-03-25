'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI, courseAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import LoadingBar from '@/components/LoadingBar';
import { Users, BookOpen, Container, Activity, Trash2, Edit, Plus, X } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'courses' | 'labs' | 'containers'>('stats');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'course' | 'lab'>('course');
  const [editingItem, setEditingItem] = useState<any>(null);

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
  }, [isAuthenticated, user, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await adminAPI.getAllUsers();
        setUsers(res.data);
      } else if (activeTab === 'courses') {
        const res = await courseAPI.getAll();
        setCourses(res.data);
      } else if (activeTab === 'containers') {
        const res = await adminAPI.getAllContainers();
        setContainers(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    try {
      await adminAPI.deleteUser(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('确定要删除此课程吗？')) return;
    try {
      await adminAPI.deleteCourse(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete course:', error);
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

  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      difficulty: formData.get('difficulty'),
      duration: parseInt(formData.get('duration') as string),
    };

    try {
      if (editingItem) {
        await adminAPI.updateCourse(editingItem.id, data);
      } else {
        await adminAPI.createCourse(data);
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              管理员控制台
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理用户、课程、实验和容器实例
            </p>
          </div>

          {/* 标签页 */}
          <div className="flex gap-2 mb-8 border-b border-white/10">
            {[
              { key: 'stats', label: '统计概览', icon: Activity },
              { key: 'users', label: '用户管理', icon: Users },
              { key: 'courses', label: '课程管理', icon: BookOpen },
              { key: 'containers', label: '容器管理', icon: Container },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 transition-all ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 统计概览 */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-on-surface-variant">总用户数</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.totalUsers || 0}</div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-sm text-on-surface-variant">总课程数</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.totalCourses || 0}</div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-sm text-on-surface-variant">总实验数</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.totalLabs || 0}</div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Container className="w-5 h-5 text-primary" />
                  <span className="text-sm text-on-surface-variant">运行容器</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.activeContainers || 0}</div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-sm text-on-surface-variant">总提交数</span>
                </div>
                <div className="text-3xl font-bold text-primary">{stats.totalSubmissions || 0}</div>
              </div>
            </div>
          )}

          {/* 用户管理 */}
          {activeTab === 'users' && (
            <div className="bg-surface-container-high rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">用户名</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">邮箱</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">角色</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">容器数</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">提交数</th>
                    <th className="text-left p-4 text-sm font-medium text-on-surface-variant">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                      <td className="p-4 text-primary">{u.username}</td>
                      <td className="p-4 text-on-surface-variant">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{u._count?.containers || 0}</td>
                      <td className="p-4 text-on-surface-variant">{u._count?.submissions || 0}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          disabled={u.role === 'ADMIN'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 课程管理 */}
          {activeTab === 'courses' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    setModalType('course');
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新建课程
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-surface-container-high rounded-xl p-6">
                    <h4 className="text-lg font-bold text-primary mb-2">{course.title}</h4>
                    <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
                      <span>难度: {course.difficulty}</span>
                      <span>{course.duration}小时</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setModalType('course');
                          setEditingItem(course);
                          setShowModal(true);
                        }}
                        className="flex-1 bg-surface-container text-primary px-3 py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="flex-1 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 容器管理 */}
          {activeTab === 'containers' && (
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
                      <td className="p-4 text-on-surface-variant">{c.user?.username}</td>
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
          )}
        </div>
      </main>

      {/* 模态框 */}
      {showModal && modalType === 'course' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">
                {editingItem ? '编辑课程' : '新建课程'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">课程名称</label>
                <input
                  name="title"
                  defaultValue={editingItem?.title}
                  required
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">课程描述</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description}
                  required
                  rows={3}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">难度</label>
                <select
                  name="difficulty"
                  defaultValue={editingItem?.difficulty || 'BEGINNER'}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="BEGINNER">初级</option>
                  <option value="INTERMEDIATE">中级</option>
                  <option value="ADVANCED">高级</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">时长（小时）</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={editingItem?.duration || 10}
                  required
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg hover:bg-surface-bright transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
