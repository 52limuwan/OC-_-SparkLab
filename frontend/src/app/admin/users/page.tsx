'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { adminAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingBar from '@/components/LoadingBar';
import { Edit, Trash2, Plus, X } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isLoggingOut, checkAuth } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
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
      const res = await adminAPI.getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
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

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const data: any = {
      username: formData.get('username') as string,
      displayName: formData.get('displayName') as string,
      role: formData.get('role') as string,
      qqNumber: formData.get('qqNumber') as string,
    };

    if (password) {
      data.password = password;
    }

    try {
      if (editingItem) {
        await adminAPI.updateUser(editingItem.id, data);
      } else {
        if (!password) {
          alert('创建新用户时密码不能为空');
          return;
        }
        await adminAPI.createUser(data);
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(editingItem ? '更新用户失败' : '创建用户失败，请检查用户名或QQ号是否已存在');
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
      <AdminSidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-primary mb-2">
              用户管理
            </h2>
            <p className="text-on-surface-variant text-lg">
              管理系统中的所有用户账号
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
              添加用户
            </button>
          </div>

          <div className="bg-surface-container-high rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">头像</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">学生名字</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">用户名</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">QQ号</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">角色</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">容器数</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">提交数</th>
                  <th className="text-left p-4 text-sm font-medium text-on-surface-variant">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-surface-container transition-colors">
                    <td className="p-4">
                      {u.qqNumber ? (
                        <img 
                          src={getQQAvatar(u.qqNumber) || ''} 
                          alt={u.displayName || u.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                          {(u.displayName || u.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-primary">{u.displayName || '未命名'}</td>
                    <td className="p-4 text-on-surface-variant">@{u.username}</td>
                    <td className="p-4 text-on-surface-variant">{u.qqNumber || '-'}</td>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(u);
                            setShowModal(true);
                          }}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          disabled={u.role === 'ADMIN'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 模态框 - 用户 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary">
                {editingItem ? '编辑用户' : '添加用户'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-2">用户名（登录用）</label>
                <input
                  name="username"
                  defaultValue={editingItem?.username}
                  required
                  placeholder="用于登录"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">学生名字（显示用）</label>
                <input
                  name="displayName"
                  defaultValue={editingItem?.displayName}
                  required
                  placeholder="真实姓名"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">
                  密码 {editingItem && <span className="text-xs">(留空则不修改)</span>}
                </label>
                <input
                  name="password"
                  type="password"
                  required={!editingItem}
                  placeholder={editingItem ? '留空则不修改密码' : ''}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">QQ号（选填）</label>
                <input
                  name="qqNumber"
                  type="text"
                  defaultValue={editingItem?.qqNumber}
                  placeholder="用于获取QQ头像"
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-2">角色</label>
                <select
                  name="role"
                  defaultValue={editingItem?.role || 'STUDENT'}
                  className="w-full bg-surface-container text-on-surface px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="STUDENT">学生</option>
                  <option value="TEACHER">教师</option>
                  <option value="ADMIN">管理员</option>
                </select>
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
                  {editingItem ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
