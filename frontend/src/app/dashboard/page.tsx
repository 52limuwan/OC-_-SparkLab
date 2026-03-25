'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { courseAPI, containerAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import LoadingBar from '@/components/LoadingBar';
import { BookOpen, Container, Clock, Award, Play } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, hours: 0, points: 0 });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user?.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [coursesRes, containersRes] = await Promise.all([
        courseAPI.getAll(),
        containerAPI.getAll(),
      ]);
      setCourses(coursesRes.data.filter((c: any) => c.isEnrolled).slice(0, 3));
      setContainers(containersRes.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              欢迎回来，{user?.username}
            </h2>
            <p className="text-on-surface-variant text-lg">
              继续你的学习之旅，掌握实战技能
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-high rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm text-on-surface-variant">已注册课程</span>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.enrolled}</div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm text-on-surface-variant">完成实验</span>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.completed}</div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm text-on-surface-variant">学习时长</span>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.hours}h</div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Container className="w-5 h-5 text-primary" />
                <span className="text-sm text-on-surface-variant">运行容器</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {containers.filter((c) => c.status === 'running').length}
              </div>
            </div>
          </div>

          {/* 我的课程 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-primary">我的课程</h3>
              <button
                onClick={() => router.push('/explore')}
                className="text-sm text-primary hover:underline"
              >
                查看全部 →
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="bg-surface-container-high rounded-xl p-8 text-center">
                <p className="text-on-surface-variant mb-4">你还没有注册任何课程</p>
                <button
                  onClick={() => router.push('/explore')}
                  className="bg-primary text-on-primary px-6 py-2 rounded-full hover:opacity-90 transition-all"
                >
                  浏览课程
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <h4 className="text-lg font-bold text-primary mb-2">{course.title}</h4>
                    <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">
                        {course.labCount} 个实验
                      </span>
                      <button className="text-primary hover:underline text-sm flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        继续学习
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 运行中的容器 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-primary">运行中的容器</h3>
              <button
                onClick={() => router.push('/containers')}
                className="text-sm text-primary hover:underline"
              >
                查看全部 →
              </button>
            </div>

            {containers.length === 0 ? (
              <div className="bg-surface-container-high rounded-xl p-8 text-center">
                <p className="text-on-surface-variant">暂无运行中的容器</p>
              </div>
            ) : (
              <div className="space-y-4">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="bg-surface-container-high rounded-xl p-6 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-bold text-primary mb-1">
                        {container.lab?.title || '未知实验'}
                      </h4>
                      <p className="text-sm text-on-surface-variant">
                        状态: {container.status === 'running' ? '运行中' : '已停止'}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/lab/${container.labId}`)}
                      className="bg-primary text-on-primary px-6 py-2 rounded-full hover:opacity-90 transition-all"
                    >
                      进入实验
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
