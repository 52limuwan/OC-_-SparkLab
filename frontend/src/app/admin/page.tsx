'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI, courseAPI } from '@/lib/api';
import Sidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Users, BookOpen, Container, Activity, Trash2, Edit, Plus, X } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [stats, setStats] = useState<any>({});

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
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getQQAvatar = (qqNumber?: string) => {
    if (!qqNumber) return null;
    return `http://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=640`;
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
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              统计概览
            </h2>
            <p className="text-on-surface-variant text-lg">
              实时监控系统运行状态和用户活动
            </p>
          </div>

          {/* 统计概览 */}
          <div className="space-y-8">
              {/* 核心指标 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm text-on-surface-variant">总用户数</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.totalUsers || 0}</div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="text-sm text-on-surface-variant">总课程数</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.totalCourses || 0}</div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm text-on-surface-variant">总实验数</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.totalLabs || 0}</div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Container className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-on-surface-variant">运行容器</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400">{stats.activeContainers || 0}</div>
                </div>

                <div className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm text-on-surface-variant">总提交数</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.totalSubmissions || 0}</div>
                </div>
              </div>

              {/* 容器状态分布 */}
              <div className="bg-surface-container-high rounded-xl p-6">
                <h3 className="text-xl font-bold text-primary mb-4">容器状态分布</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.containersByStatus?.map((item: any) => (
                    <div key={item.status} className="bg-surface-container rounded-lg p-4">
                      <div className="text-sm text-on-surface-variant mb-1">
                        {item.status === 'running' ? '运行中' : 
                         item.status === 'stopped' ? '已停止' : 
                         item.status === 'creating' ? '创建中' : '错误'}
                      </div>
                      <div className={`text-2xl font-bold ${
                        item.status === 'running' ? 'text-green-400' : 
                        item.status === 'error' ? 'text-red-400' : 'text-on-surface-variant'
                      }`}>
                        {item._count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 最近活跃用户 */}
                <div className="bg-surface-container-high rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-primary">最近活跃用户</h3>
                    <button
                      onClick={() => router.push('/admin/users')}
                      className="text-sm text-primary hover:underline"
                    >
                      查看全部 →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentUsers?.map((user: any) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-bright transition-all">
                        {user.qqNumber ? (
                          <img 
                            src={getQQAvatar(user.qqNumber) || ''} 
                            alt={user.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-bold text-primary">{user.username}</div>
                          <div className="text-xs text-on-surface-variant">
                            {user._count.containers} 容器 · {user._count.submissions} 提交
                          </div>
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {new Date(user.lastActiveAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 热门课程 */}
                <div className="bg-surface-container-high rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-primary">热门课程</h3>
                    <button
                      onClick={() => router.push('/admin/courses')}
                      className="text-sm text-primary hover:underline"
                    >
                      查看全部 →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.courseStats?.map((course: any, index: number) => (
                      <div key={course.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-bright transition-all">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-surface-container-lowest text-on-surface-variant'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-primary">{course.title}</div>
                          <div className="text-xs text-on-surface-variant">
                            {course._count.labs} 实验
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary">{course._count.enrollments}</div>
                          <div className="text-xs text-on-surface-variant">注册</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 最近容器活动 */}
              <div className="bg-surface-container-high rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-primary">最近容器活动</h3>
                  <button
                    onClick={() => router.push('/admin/containers')}
                    className="text-sm text-primary hover:underline"
                  >
                    查看全部 →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-on-surface-variant">容器ID</th>
                        <th className="text-left p-3 text-sm font-medium text-on-surface-variant">用户</th>
                        <th className="text-left p-3 text-sm font-medium text-on-surface-variant">实验</th>
                        <th className="text-left p-3 text-sm font-medium text-on-surface-variant">状态</th>
                        <th className="text-left p-3 text-sm font-medium text-on-surface-variant">创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentContainers?.map((container: any) => (
                        <tr key={container.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                          <td className="p-3 text-primary font-mono text-xs">{container.id.slice(0, 8)}</td>
                          <td className="p-3 text-on-surface-variant">{container.user?.username}</td>
                          <td className="p-3 text-on-surface-variant">{container.lab?.title}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              container.status === 'running' ? 'bg-green-500/20 text-green-400' : 
                              container.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                              container.status === 'creating' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {container.status === 'running' ? '运行中' : 
                               container.status === 'stopped' ? '已停止' : 
                               container.status === 'creating' ? '创建中' : '错误'}
                            </span>
                          </td>
                          <td className="p-3 text-on-surface-variant text-xs">
                            {new Date(container.createdAt).toLocaleString('zh-CN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
