'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function TopNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  // 等待客户端挂载完成
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed top-0 z-50 w-full">
      <div className="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-[clamp(16px,5vw,96px)]">
        {/* 左侧 Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tighter text-white select-none outline-0 cursor-pointer">
          星火实验室
        </Link>

        {/* 右侧按钮 */}
        <div>
          <Link
            href="/lab"
            className="cursor-pointer rounded-full border-none bg-white px-8 py-3 font-bold text-base text-black transition-opacity duration-150 hover:opacity-90"
          >
            开始实验
          </Link>
        </div>
      </div>
    </nav>
  )
}
