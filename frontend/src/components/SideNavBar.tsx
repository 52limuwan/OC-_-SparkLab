'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SideNavBar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-surface-container-low py-4 border-none">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            biotech
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface leading-none">我的项目</h2>
          <span className="text-[0.65rem] font-mono text-on-surface-variant">ID: 992-UX</span>
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        <Link 
          href="/dashboard" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/dashboard' 
              ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container' 
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined mr-3">dashboard</span> 
          控制台
        </Link>
        <Link 
          href="/lab" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname.startsWith('/lab') 
              ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container' 
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined mr-3">biotech</span> 
          我的实验
        </Link>
        <Link 
          href="/resources" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/resources' 
              ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container' 
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined mr-3">storage</span> 
          学习资源
        </Link>
        <Link 
          href="/analytics" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/analytics' 
              ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container' 
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined mr-3">monitoring</span> 
          学习统计
        </Link>
        <Link 
          href="/team" 
          className={`flex items-center px-4 py-2.5 font-mono text-sm transition-all duration-200 ${
            pathname === '/team' 
              ? 'text-secondary font-bold border-r-2 border-secondary bg-surface-container' 
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined mr-3">group</span> 
          班级
        </Link>
      </nav>
      <div className="mt-auto px-4 pt-4">
        <button className="w-full bg-surface-container hover:bg-surface-container-high text-primary border border-primary/20 py-2 rounded font-mono text-xs flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined text-sm">add</span> 新建实验
        </button>
        <div className="space-y-1">
          <Link 
            href="/support" 
            className="flex items-center px-4 py-2 text-on-surface-variant font-mono text-xs hover:text-on-surface"
          >
            <span className="material-symbols-outlined mr-3 text-sm">help_outline</span> 帮助支持
          </Link>
          <Link 
            href="/logs" 
            className="flex items-center px-4 py-2 text-on-surface-variant font-mono text-xs hover:text-on-surface"
          >
            <span className="material-symbols-outlined mr-3 text-sm">list_alt</span> 操作日志
          </Link>
        </div>
      </div>
    </aside>
  )
}
