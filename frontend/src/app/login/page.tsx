'use client';

import { AnimatedCharacters } from '@/components/AnimatedCharacters';
import LoadingBar from '@/components/LoadingBar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCredit, setShowCredit] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    // 检查是否从注册页面跳转过来
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setSuccess('注册成功！请登录您的账号');
        }
    }, []);

    // 检查登录状态，如果已登录则跳转
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            if (user?.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

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

    // 如果正在检查认证状态或已经登录，显示加载状态
    if (isLoading || isAuthenticated) {
        return <LoadingBar />;
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* 左侧：品牌视觉区 */}
            <div className="hidden lg:flex relative flex-col justify-center items-center p-12 bg-gradient-to-br from-surface-lowest via-surface-low to-surface-container overflow-hidden">
                <div className="relative z-20">
                    <AnimatedCharacters
                        isTyping={isTyping}
                        showPassword={showPassword}
                        passwordLength={passwordValue.length}
                    />
                </div>

                {/* 装饰元素 */}
                <div className="absolute top-[15%] right-[10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
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
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h1 
                            className="text-3xl font-bold text-primary mb-3 tracking-tight cursor-pointer select-none"
                            onDoubleClick={() => setShowCredit(!showCredit)}
                        >
                            登录 到 星火实验室
                        </h1>
                        {showCredit && (
                            <p className="text-sm text-on-surface-variant mb-2">
                                由 21动漫1班 肖瑞杰 倾力制作
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">账号</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                    placeholder="用户名或QQ号"
                                    required
                                    minLength={3}
                                    className="w-full h-12 pl-11 pr-4 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface placeholder-on-surface-variant focus:bg-surface-bright focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">密码</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
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
                                    className="w-full h-12 pl-11 pr-12 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface placeholder-on-surface-variant focus:bg-surface-bright focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 text-sm text-on-error-container bg-error-container border border-error-dim rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="px-4 py-3 text-sm text-green-800 bg-green-100 border border-green-300 rounded-lg">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-primary hover:opacity-90 text-on-primary font-semibold rounded-xl transition-all active:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>

                    <div className="text-center text-sm text-on-surface-variant mt-7">
                        暂无账号？{' '}
                        <a href="/register" className="text-primary font-medium hover:underline">
                            自助注册
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
