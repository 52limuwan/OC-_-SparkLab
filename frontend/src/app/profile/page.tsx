'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/Sidebar';
import LoadingBar from '@/components/LoadingBar';
import { User, Award, BookOpen, Clock, Edit2, Save, X, Camera } from 'lucide-react';
import api from '@/lib/api';

interface UserStats {
  enrolledCourses: number;
  completedLabs: number;
  totalScore: number;
  studyTime: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [stats, setStats] = useState<UserStats>({
    enrolledCourses: 0,
    completedLabs: 0,
    totalScore: 0,
    studyTime: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    qqNumber: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || '',
        displayName: user.displayName || '',
        qqNumber: user.qqNumber || '',
      });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const response = await api.get('/auth/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        username: user.username || '',
        displayName: user.displayName || '',
        qqNumber: user.qqNumber || '',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/auth/profile', editForm);
      await checkAuth();
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return user.avatar;
    }
    if (user?.qqNumber) {
      return `https://q1.qlogo.cn/g?b=qq&nk=${user.qqNumber}&s=640`;
    }
    return `https://ui-avatars.com/api/?name=${user?.displayName}&background=6366f1&color=fff&size=200`;
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* 头部 */}
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              个人资料
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理你的个人信息和学习数据
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：用户信息卡片 */}
            <div className="lg:col-span-1">
              <div className="bg-surface-container-high rounded-xl p-6">
                {/* 头像 */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <img
                      src={getAvatarUrl()}
                      alt={user.displayName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary mt-4">{user.displayName}</h3>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/20 text-primary mt-2">
                    {user.role === 'ADMIN' ? '管理员' : user.role === 'TEACHER' ? '教师' : '学生'}
                  </span>
                </div>

                {/* 用户信息 */}
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-sm text-on-surface-variant mb-1 block">用户名（登录用）</label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full bg-surface-container px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-on-surface-variant mb-1 block">学生名字（显示用）</label>
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          className="w-full bg-surface-container px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-on-surface-variant mb-1 block">QQ号</label>
                        <input
                          type="text"
                          value={editForm.qqNumber}
                          onChange={(e) => setEditForm({ ...editForm, qqNumber: e.target.value })}
                          placeholder="用于显示QQ头像"
                          className="w-full bg-surface-container px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 bg-primary text-on-primary py-2 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex-1 bg-surface-container text-on-surface py-2 rounded-lg hover:bg-surface-bright transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <User className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">{user.displayName}</p>
                          <p className="text-xs text-on-surface-variant/70">@{user.username}</p>
                        </div>
                      </div>
                      {user.qqNumber && (
                        <div className="flex items-center gap-3 text-on-surface-variant">
                          <span className="text-sm">QQ</span>
                          <span>{user.qqNumber}</span>
                        </div>
                      )}
                      <button
                        onClick={handleEdit}
                        className="w-full bg-primary text-on-primary py-2 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑资料
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：统计数据 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 学习统计 */}
              <div className="bg-surface-container-high rounded-xl p-6">
                <h3 className="text-xl font-bold text-primary mb-6">学习统计</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{stats.enrolledCourses}</p>
                        <p className="text-sm text-on-surface-variant">已注册课程</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{stats.completedLabs}</p>
                        <p className="text-sm text-on-surface-variant">完成实验</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-500">{stats.totalScore}</p>
                        <p className="text-sm text-on-surface-variant">总积分</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-500">{Math.floor(stats.studyTime / 60)}h</p>
                        <p className="text-sm text-on-surface-variant">学习时长</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 最近活动 */}
              <div className="bg-surface-container-high rounded-xl p-6">
                <h3 className="text-xl font-bold text-primary mb-4">最近活动</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <p className="text-sm text-on-surface-variant">暂无活动记录</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
