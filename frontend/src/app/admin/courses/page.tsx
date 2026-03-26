'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI, courseAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Edit, Trash2, Plus, X, BookOpen, Eye, EyeOff, List } from 'lucide-react';

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

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
      loadCourses();
    }
  }, [isAuthenticated, user]);

  const loadCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('确定要删除此课程吗？这将同时删除课程下的所有实验！')) return;
    try {
      await adminAPI.deleteCourse(id);
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('删除失败，请重试');
    }
  };

  const handleTogglePublish = async (course: any) => {
    try {
      await adminAPI.updateCourse(course.id, {
        isPublished: !course.isPublished,
      });
      loadCourses();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      alert('操作失败，请重试');
    }
  };

  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      difficulty: formData.get('difficulty') as string,
      duration: parseInt(formData.get('duration') as string),
      cover: formData.get('cover') as string || null,
      isPublished: formData.get('isPublished') === 'true',
    };

    try {
      if (editingCourse) {
        await adminAPI.updateCourse(editingCourse.id, data);
      } else {
        await adminAPI.createCourse(data);
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('保存失败，请重试');
    }
  };

  const handleManageLabs = (course: any) => {
    router.push(`/admin/courses/${course.id}/labs`);
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
              管理系统中的所有课程和实验
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                setEditingCourse(null);
                setShowCourseModal(true);
              }}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              新建课程
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-surface-container-high rounded-xl p-6 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-bold text-primary flex-1 pr-2">{course.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    course.isPublished 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {course.isPublished ? '已发布' : '未发布'}
                  </span>
                </div>
                
                <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 flex-grow">
                  {course.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4 pb-4 border-b border-white/10">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {course.labCount || 0} 实验
                  </span>
                  <span>
                    {course.difficulty === 'beginner' ? '入门' : 
                     course.difficulty === 'intermediate' ? '进阶' : '高级'}
                  </span>
                  <span>{course.duration} 分钟</span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleManageLabs(course)}
                    className="w-full bg-blue-500/20 text-blue-400 px-3 py-2.5 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <List className="w-4 h-4" />
                    管理实验 ({course.labCount || 0})
                  </button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleTogglePublish(course)}
                      className="bg-surface-container text-primary px-2 py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-1 text-xs"
                      title={course.isPublished ? '取消发布' : '发布课程'}
                    >
                      {course.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{course.isPublished ? '取消' : '发布'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setShowCourseModal(true);
                      }}
                      className="bg-surface-container text-primary px-2 py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-1 text-xs"
                      title="编辑课程"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">编辑</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="bg-red-500/20 text-red-400 px-2 py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-1 text-xs"
                      title="删除课程"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">删除</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-20 h-20 mx-auto mb-6 text-on-surface-variant opacity-30" />
              <h3 className="text-xl font-bold text-primary mb-2">暂无课程</h3>
              <p className="text-on-surface-variant mb-6">
                点击上方"新建课程"按钮创建第一个课程
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 课程编辑模态框 */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">
                {editingCourse ? '编辑课程' : '新建课程'}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">课程名称 *</label>
                <input
                  name="title"
                  defaultValue={editingCourse?.title}
                  required
                  placeholder="例如：Linux 基础入门"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">课程描述 *</label>
                <textarea
                  name="description"
                  defaultValue={editingCourse?.description}
                  required
                  rows={3}
                  placeholder="简要描述课程内容和学习目标"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-on-surface-variant mb-2">难度等级 *</label>
                  <select
                    name="difficulty"
                    defaultValue={editingCourse?.difficulty || 'beginner'}
                    className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="beginner">入门</option>
                    <option value="intermediate">进阶</option>
                    <option value="advanced">高级</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-2">预计时长（分钟） *</label>
                  <input
                    name="duration"
                    type="number"
                    defaultValue={editingCourse?.duration || 60}
                    required
                    min="1"
                    placeholder="60"
                    className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">封面图片 URL（可选）</label>
                <input
                  name="cover"
                  type="url"
                  defaultValue={editingCourse?.cover || ''}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">发布状态</label>
                <select
                  name="isPublished"
                  defaultValue={editingCourse?.isPublished ? 'true' : 'false'}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="false">未发布（学生不可见）</option>
                  <option value="true">已发布（学生可见）</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
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
