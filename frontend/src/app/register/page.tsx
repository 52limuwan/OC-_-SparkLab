'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
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

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为 6 位')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // 注册成功，跳转到登录页
        router.push('/login?registered=true')
      } else {
        setError(data.message || '注册失败，请稍后重试')
      }
    } catch (err) {
      console.error('注册错误:', err)
      setError('连接服务器失败，请检查后端是否运行在 http://localhost:4000')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-[#070d1f] text-[#dfe4fe] font-body min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a3a6ff] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#69f6b8] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Register Card Container */}
      <main className="w-full max-w-[480px] relative z-10">
        <div className="bg-[#11192e] rounded-lg border border-[#41475b]/20 shadow-[0px_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Card Header */}
          <div className="p-8 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#dfe4fe] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>创建账户</h1>
            <p className="text-[#a5aac2] text-sm">加入 DevLab</p>
          </div>

          {/* Register Form */}
          <form className="p-8 pt-4 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-[#a70138]/20 border border-[#ff6e84]/20 rounded text-[#ff6e84] text-sm">
                {error}
              </div>
            )}
            
            {/* Username Field */}
            <div className="group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2] mb-1.5 ml-1" htmlFor="username" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                用户名
              </label>
              <input
                className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
                id="username"
                name="username"
                placeholder="请输入用户名"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email Field */}
            <div className="group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2] mb-1.5 ml-1" htmlFor="email" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                QQ邮箱
              </label>
              <input
                className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
                id="email"
                name="email"
                placeholder="123456789@qq.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2] mb-1.5 ml-1" htmlFor="password" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                密码
              </label>
              <input
                className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
                id="password"
                name="password"
                placeholder="••••••••"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#a5aac2] mb-1.5 ml-1" htmlFor="confirmPassword" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                确认密码
              </label>
              <input
                className="w-full h-12 bg-[#171f36] border-0 border-b-2 border-transparent focus:border-[#a3a6ff] focus:ring-0 text-[#dfe4fe] placeholder:text-[#6f758b] transition-all rounded-t px-4 py-2"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 rounded bg-[#171f36] border-[#41475b] text-[#a3a6ff] focus:ring-[#a3a6ff]/20"
                required
              />
              <label htmlFor="terms" className="text-xs text-[#a5aac2]">
                我已阅读并同意 <a href="#" className="text-[#a3a6ff] hover:underline">服务条款</a> 和 <a href="#" className="text-[#a3a6ff] hover:underline">隐私政策</a>
              </label>
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
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <span>创建账户</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer / Switch Action */}
          <div className="p-6 bg-[#0c1326] border-t border-[#41475b]/10 text-center">
            <p className="text-sm text-[#a5aac2]">
              已有账号？ <Link href="/login" className="text-[#69f6b8] font-bold hover:underline transition-all">立即登录</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
