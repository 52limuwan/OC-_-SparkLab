'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setToken, setCurrentUser, isAuthenticated } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
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
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
        setError(data.message || '用户名或密码错误')
      }
    } catch (err) {
      console.error('登录错误:', err)
      setError('连接服务器失败，请检查后端是否运行在 http://localhost:4000')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#070d1f] text-[#dfe4fe] font-body min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a3a6ff] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#69f6b8] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Login Card Container */}
      <main className="w-full max-w-[420px] relative z-10">
        <div className="bg-[#11192e] rounded-lg border border-[#41475b]/20 shadow-[0px_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Card Header */}
          <div className="p-8 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#dfe4fe] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>DevLab</h1>
            <p className="text-[#a5aac2] text-sm">登录进入你的实验环境</p>
          </div>

          {/* Login Form */}
          <form className="p-8 pt-4 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-[#a70138]/20 border border-[#ff6e84]/20 rounded text-[#ff6e84] text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Username Field */}
              <div className="group">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2] mb-1.5 ml-1" htmlFor="username" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  用户名
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
                    id="username"
                    placeholder="请输入用户名"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex justify-between items-end mb-1.5 ml-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2]" htmlFor="password" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    密码
                  </label>
                  <a className="text-xs text-[#8387ff] hover:text-[#a3a6ff] transition-colors font-medium" href="#">
                    忘记密码？
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
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
              className="w-full h-12 bg-gradient-to-b from-[#a3a6ff] to-[#6063ee] text-[#0f00a4] font-bold tracking-tight rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#0f00a4]"></span>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>登录到实验环境</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer / Switch Action */}
          <div className="p-6 bg-[#0c1326] border-t border-[#41475b]/10 text-center">
            <p className="text-sm text-[#a5aac2]">
              还没有账号？ <Link href="/register" className="text-[#69f6b8] font-bold hover:underline transition-all">立即注册</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
