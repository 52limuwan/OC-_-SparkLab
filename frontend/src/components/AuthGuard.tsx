'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  // 在客户端挂载之前，显示加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070d1f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#a3a6ff]"></div>
          <p className="mt-4 text-[#a5aac2]">正在验证身份...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#070d1f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#a3a6ff]"></div>
          <p className="mt-4 text-[#a5aac2]">正在验证身份...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
