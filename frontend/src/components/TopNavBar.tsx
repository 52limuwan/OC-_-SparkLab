'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function TopNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 等待客户端挂载完成
  useEffect(() => {
    setMounted(true)
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <nav className="fixed top-0 z-50 w-full h-16 px-6 flex justify-between items-center bg-background border-none">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tighter text-on-surface">
          Docker 实训平台
        </Link>
        <div className="hidden md:flex gap-6">
          <Link 
            href="/explore" 
            className={`text-sm transition-colors ${pathname === '/explore' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            浏览课程
          </Link>
          <Link 
            href="/docs" 
            className={`text-sm transition-colors ${pathname === '/docs' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            文档
          </Link>
          <Link 
            href="/status" 
            className={`text-sm transition-colors ${pathname === '/status' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            系统状态
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center bg-surface-container px-3 py-1.5 rounded border border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
          <input 
            className="bg-transparent border-none outline-none text-xs text-on-surface w-48 focus:ring-0 placeholder:text-on-surface-variant" 
            placeholder="搜索文档..." 
            type="text"
          />
          <span className="ml-4 text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface-variant">CTRL K</span>
        </div>
        
        {!mounted ? (
          // 服务端渲染时显示占位符，避免 hydration 错误
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-surface-container rounded animate-pulse"></div>
            <div className="w-20 h-10 bg-surface-container rounded animate-pulse"></div>
          </div>
        ) : isAuthenticated ? (
          <>
            <div className="flex items-center gap-3">
              <button className="p-2 text-on-surface-variant hover:text-on-surface active:scale-95 duration-150 transition-colors">
                <span className="material-symbols-outlined">terminal</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-on-surface active:scale-95 duration-150 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:text-on-surface active:scale-95 duration-150 transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <Link 
              href="/lab" 
              className="ml-2 tonal-gradient text-on-primary px-4 py-2 font-bold rounded active:scale-95 transition-all duration-150"
            >
              开始实验
            </Link>
            
            {/* 用户菜单 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-highest rounded-lg border border-outline-variant/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden backdrop-blur-xl">
                  {/* 用户信息头部 - 带渐变背景 */}
                  <div className="p-4 border-b border-outline-variant/20 bg-gradient-to-br from-primary/10 to-secondary/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-on-primary font-bold text-lg shadow-lg">
                        {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface truncate">{user?.username || '用户'}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-secondary-container/50 text-on-secondary text-[10px] font-mono rounded">精英学员</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">Lvl 12</span>
                    </div>
                  </div>
                  
                  {/* 导航菜单 */}
                  <div className="py-2 bg-surface-container-high">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest transition-colors text-on-surface"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-lg text-primary">dashboard</span>
                      <span className="text-sm font-medium">控制台</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest transition-colors text-on-surface"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-lg text-secondary">person</span>
                      <span className="text-sm font-medium">个人资料</span>
                    </Link>
                    <Link
                      href="/lab"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest transition-colors text-on-surface"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-lg text-tertiary">science</span>
                      <span className="text-sm font-medium">我的实验</span>
                    </Link>
                  </div>
                  
                  {/* 退出按钮 */}
                  <div className="border-t border-outline-variant/20 py-2 bg-surface-container-high">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-error-container/30 transition-colors text-error group"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">logout</span>
                      <span className="text-sm font-medium">退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-primary hover:text-on-surface transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 tonal-gradient text-on-primary font-bold rounded active:scale-95 transition-all duration-150"
            >
              注册
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
