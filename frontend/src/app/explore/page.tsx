'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { courseAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import LoadingBar from '@/components/LoadingBar';
import { BookOpen, Clock, Award, ArrowLeft } from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await courseAPI.enroll(courseId);
      loadCourses();
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  const handleContinue = (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/courses/${courseId}`);
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {isAuthenticated && <Sidebar />}

      <main className={`flex-1 ${isAuthenticated ? 'ml-64' : ''} p-8`}>
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        )}

        <div className="mb-10">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
            课程中心
          </h2>
          <p className="text-on-surface-variant text-lg">
            探索精心设计的实战课程，提升你的技术能力
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all"
            >
              <div className="mb-4">
                <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">
                  {course.difficulty === 'beginner' ? '入门' : course.difficulty === 'intermediate' ? '进阶' : '高级'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-primary mb-2">{course.title}</h3>
              <p className="text-sm text-on-surface-variant mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="flex items-center gap-4 mb-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {course.labCount} 实验
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration} 分钟
                </div>
              </div>

              {course.isEnrolled ? (
                <button
                  onClick={() => handleContinue(course.id)}
                  className="w-full bg-primary text-on-primary py-2 rounded-full hover:opacity-90 transition-all"
                >
                  继续学习
                </button>
              ) : (
                <button
                  onClick={() => handleEnroll(course.id)}
                  className="w-full bg-surface-container-lowest text-primary border border-primary/20 py-2 rounded-full hover:bg-primary/10 transition-all"
                >
                  立即注册
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
