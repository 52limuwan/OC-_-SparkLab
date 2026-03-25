'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getQQAvatar } from '@/lib/avatar'

export default function SideNavBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 在服务端和客户端挂载前返回相同的占位符
  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 h-full bg-[#11192e] py-4 border-none">
        {/* 占位符，防止 hydration 不匹配 */}
      </aside>
    )
  }

  const avatarUrl = user?.email ? getQQAvatar(user.email, 100) : ''

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#11192e] py-4 border-none">
      <Link href="/profile" className="px-6 mb-8 flex items-center gap-3 hover:opacity-80 transition-opacity">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="用户头像" 
            className="w-10 h-10 rounded-lg object-cover"
            onError={(e) => {
              // 如果头像加载失败，显示默认图标
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="w-10 h-10 bg-[#171f36] rounded-lg flex items-center justify-center" style={{ display: avatarUrl ? 'none' : 'flex' }}>
          <span className="material-symbols-outlined text-[#69f6b8]" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#dfe4fe] leading-none">{user?.username || '我的项目'}</h2>
          <span className="text-[0.65rem] font-mono text-[#a5aac2]">ID: 992-UX</span>
        </div>
      </Link>
      <nav className="flex-1 px-2 space-y-1">
        <Link 
          href="/dashboard" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/dashboard' 
              ? 'text-[#69f6b8] font-bold border-r-2 border-[#69f6b8] bg-[#171f36]' 
              : 'text-[#a5aac2] hover:bg-[#171f36] hover:text-[#dfe4fe]'
          }`}
        >
          <span className="material-symbols-outlined mr-3">dashboard</span> 
          控制台
        </Link>
        <Link 
          href="/lab" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname.startsWith('/lab') 
              ? 'text-[#69f6b8] font-bold border-r-2 border-[#69f6b8] bg-[#171f36]' 
              : 'text-[#a5aac2] hover:bg-[#171f36] hover:text-[#dfe4fe]'
          }`}
        >
          <span className="material-symbols-outlined mr-3">biotech</span> 
          我的实验
        </Link>
        <Link 
          href="/resources" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/resources' 
              ? 'text-[#69f6b8] font-bold border-r-2 border-[#69f6b8] bg-[#171f36]' 
              : 'text-[#a5aac2] hover:bg-[#171f36] hover:text-[#dfe4fe]'
          }`}
        >
          <span className="material-symbols-outlined mr-3">storage</span> 
          学习资源
        </Link>
        <Link 
          href="/analytics" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/analytics' 
              ? 'text-[#69f6b8] font-bold border-r-2 border-[#69f6b8] bg-[#171f36]' 
              : 'text-[#a5aac2] hover:bg-[#171f36] hover:text-[#dfe4fe]'
          }`}
        >
          <span className="material-symbols-outlined mr-3">monitoring</span> 
          学习统计
        </Link>
        <Link 
          href="/team" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/team' 
              ? 'text-[#69f6b8] font-bold border-r-2 border-[#69f6b8] bg-[#171f36]' 
              : 'text-[#a5aac2] hover:bg-[#171f36] hover:text-[#dfe4fe]'
          }`}
        >
          <span className="material-symbols-outlined mr-3">group</span> 
          班级
        </Link>
      </nav>
      <div className="mt-auto px-4 pt-4">
        <button className="w-full bg-[#171f36] hover:bg-[#1c253e] text-[#a3a6ff] border border-[#a3a6ff]/20 py-2 rounded font-mono text-xs flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined text-sm">add</span> 新建实验
        </button>
        <div className="space-y-1">
          <Link 
            href="/support" 
            className="flex items-center px-4 py-2 text-[#a5aac2] font-mono text-xs hover:text-[#dfe4fe]"
          >
            <span className="material-symbols-outlined mr-3 text-sm">help_outline</span> 帮助支持
          </Link>
          <Link 
            href="/logs" 
            className="flex items-center px-4 py-2 text-[#a5aac2] font-mono text-xs hover:text-[#dfe4fe]"
          >
            <span className="material-symbols-outlined mr-3 text-sm">list_alt</span> 操作日志
          </Link>
          <Link 
            href="/profile" 
            className="flex items-center px-4 py-2 text-[#a5aac2] font-mono text-xs hover:text-[#dfe4fe]"
          >
            <span className="material-symbols-outlined mr-3 text-sm">person</span> 个人资料
          </Link>
          <button 
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                // 清除认证信息
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                // 跳转到登录页
                window.location.href = '/login'
              }
            }}
            className="w-full flex items-center px-4 py-2 text-[#ff6e84] font-mono text-xs hover:text-[#ff8a9a] hover:bg-[#171f36] rounded transition-colors"
          >
            <span className="material-symbols-outlined mr-3 text-sm">logout</span> 退出登录
          </button>
        </div>
      </div>
    </aside>
  )
}
