'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI, courseAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Edit, Trash2, Plus, X } from 'lucide-react';

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
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
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
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
              课程管理
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理系统中的所有课程
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
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
      </main>

      {/* 模态框 - 课程 */}
      {showModal && (
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
