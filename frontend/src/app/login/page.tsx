'use client';

import { AnimatedCharacters } from '@/components/AnimatedCharacters';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.username, formData.password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || '账号或密码有误，请重新输入');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* 左侧：品牌视觉区 */}
            <div className="hidden lg:flex relative flex-col justify-center items-center p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 overflow-hidden">
                <div className="relative z-20">
                    <AnimatedCharacters
                        isTyping={isTyping}
                        showPassword={showPassword}
                        passwordLength={passwordValue.length}
                    />
                </div>

                {/* 装饰元素 */}
                <div className="absolute top-[15%] right-[10%] w-[300px] h-[300px] bg-blue-500/25 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-blue-800/30 rounded-full blur-[100px] pointer-events-none" />
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            {/* 右侧：登录表单 */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* 移动端 Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-12">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                                <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#1E40AF" fillOpacity="0.9" />
                                <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#3B82F6" fillOpacity="0.7" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Nexus 平台</span>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">登录到工作台</h1>
                        <p className="text-sm text-gray-600">统一接入前端平台旗下所有系统</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                    placeholder="输入您的账号"
                                    required
                                    minLength={3}
                                    className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        setPasswordValue(e.target.value);
                                    }}
                                    placeholder="输入您的密码"
                                    required
                                    minLength={6}
                                    className="w-full h-12 pl-11 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-all active:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">或</span>
                        </div>
                    </div>

                    <button className="w-full h-12 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-800/25 text-gray-700 hover:text-blue-800 font-medium rounded-xl transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                        飞书账号一键登录
                    </button>

                    <div className="text-center text-sm text-gray-600 mt-7">
                        暂无账号？{' '}
                        <a href="/register" className="text-blue-800 font-medium hover:underline">
                            联系管理员申请开通
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
