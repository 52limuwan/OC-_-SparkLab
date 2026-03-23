'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setToken, setCurrentUser, isAuthenticated } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 如果已登录，重定向到控制台
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        // 保存 token 和用户信息
        setToken(data.access_token)
        if (data.user) {
          setCurrentUser(data.user)
        }
        
        // 跳转到控制台
        router.push('/dashboard')
      } else {
        setError(data.message || '邮箱或密码错误')
      }
    } catch (err) {
      console.error('登录错误:', err)
      setError('连接服务器失败，请检查后端是否运行')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Decor */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Login Card Container */}
      <main className="w-full max-w-[420px] relative z-10">
        <div className="glass-panel rounded-lg border border-outline-variant/20 shadow-[0px_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Card Header */}
          <div className="p-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-surface-container-high border border-outline-variant/30 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
            </div>
            <h1 className="text-2xl font-bold font-headline tracking-tight text-on-surface mb-2">Docker 实训平台</h1>
            <p className="text-on-surface-variant text-sm">登录进入你的实验环境</p>
          </div>

          {/* Login Form */}
          <form className="p-8 pt-4 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-error-container/20 border border-error/20 rounded text-error text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Email Field */}
              <div className="group">
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1" htmlFor="email">
                  邮箱地址
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline transition-all rounded-t px-4 py-2"
                    id="email"
                    placeholder="student@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5 ml-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant" htmlFor="password">
                    密码
                  </label>
                  <a className="text-xs text-primary-fixed-dim hover:text-primary transition-colors font-medium" href="#">
                    忘记密码？
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline transition-all rounded-t px-4 py-2"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Primary Action */}
            <button
              className="w-full h-12 bg-gradient-to-b from-primary to-primary-dim text-on-primary font-bold tracking-tight rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></span>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>登录到实验环境</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-outline-variant/30 flex-1"></div>
              <span className="text-[0.65rem] font-mono uppercase text-outline tracking-widest">第三方登录</span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="h-11 flex items-center justify-center gap-2 rounded border border-outline-variant/40 bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 group"
                type="button"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">code</span>
                <span className="text-xs font-mono text-on-surface">GitHub</span>
              </button>
              <button
                className="h-11 flex items-center justify-center gap-2 rounded border border-outline-variant/40 bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 group"
                type="button"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">rebase</span>
                <span className="text-xs font-mono text-on-surface">GitLab</span>
              </button>
            </div>
          </form>

          {/* Footer / Switch Action */}
          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 text-center">
            <p className="text-sm text-on-surface-variant">
              还没有账号？ <Link href="/register" className="text-secondary font-bold hover:underline transition-all">立即注册</Link>
            </p>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(105,246,184,0.4)]"></div>
              <span className="text-[0.65rem] font-mono text-on-surface-variant uppercase tracking-tighter">系统状态：就绪</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-mono text-outline uppercase tracking-tighter">延迟: 24ms</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-outline text-sm">language</span>
            <span className="text-[0.65rem] font-mono text-outline uppercase tracking-tighter">v4.2.0-stable</span>
          </div>
        </div>
      </main>
    </div>
  )
}
