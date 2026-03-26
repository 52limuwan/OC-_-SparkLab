'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { courseAPI, labAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import LoadingBar from '@/components/LoadingBar';
import { BookOpen, Clock, Award, Play, CheckCircle, Lock, ArrowLeft } from 'lucide-react';

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && courseId) {
      loadCourse();
      loadLabs();
    }
  }, [isAuthenticated, courseId]);

  const loadCourse = async () => {
    try {
      const res = await courseAPI.getOne(courseId);
      setCourse(res.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const loadLabs = async () => {
    try {
      const res = await labAPI.getByCourse(courseId);
      setLabs(res.data);
    } catch (error) {
      console.error('Failed to load labs:', error);
    }
  };

  const handleStartLab = (labId: string) => {
    router.push(`/lab/${labId}`);
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  if (!isAuthenticated || !course) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <button
          onClick={() => router.push('/explore')}
          className="mb-6 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回课程中心
        </button>

        {/* 课程头部 */}
        <div className="bg-surface-container-high rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary mb-3 inline-block">
                {course.difficulty === 'beginner' ? '入门' : course.difficulty === 'intermediate' ? '进阶' : '高级'}
              </span>
              <h1 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-3">
                {course.title}
              </h1>
              <p className="text-on-surface-variant text-lg mb-4">
                {course.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>{labs.length} 个实验</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{course.duration} 分钟</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>进度: {course.progress || 0}%</span>
            </div>
          </div>
        </div>

        {/* 实验列表 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-4">课程实验</h2>
          <p className="text-on-surface-variant mb-6">
            完成以下实验，掌握核心技能
          </p>
        </div>

        <div className="space-y-4">
          {labs.map((lab, index) => (
            <div
              key={lab.id}
              className="bg-surface-container-high rounded-xl p-6 hover:bg-surface-bright transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-primary">{lab.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
                        {lab.difficulty === 'beginner' ? '入门' : lab.difficulty === 'intermediate' ? '进阶' : '高级'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-on-surface-variant mb-3">
                      {lab.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lab.timeLimit} 分钟
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {lab.points} 分
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartLab(lab.id)}
                  className="bg-primary text-on-primary px-6 py-3 rounded-full hover:opacity-90 transition-all flex items-center gap-2 ml-4"
                >
                  <Play className="w-4 h-4" />
                  进入学习
                </button>
              </div>
            </div>
          ))}

          {labs.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>该课程暂无实验</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
