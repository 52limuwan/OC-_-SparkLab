'use client'

import Link from 'next/link'
import TopNavBar from '@/components/TopNavBar'
import SideNavBar from '@/components/SideNavBar'
import StatusBar from '@/components/StatusBar'
import AuthGuard from '@/components/AuthGuard'

export default function DashboardPage() {
  const recentLabs = [
    { id: 1, title: 'Nginx 容器部署', progress: 100, status: 'completed', score: 98 },
    { id: 2, title: 'Docker 网络配置', progress: 75, status: 'in-progress', score: null },
    { id: 3, title: 'Docker Compose 实战', progress: 0, status: 'not-started', score: null },
  ]

  const stats = [
    { label: '已完成实验', value: '12', icon: 'check_circle', color: 'text-secondary' },
    { label: '进行中', value: '3', icon: 'pending', color: 'text-primary' },
    { label: '学习时长', value: '48h', icon: 'schedule', color: 'text-tertiary' },
    { label: '平均分数', value: '92', icon: 'star', color: 'text-secondary' },
  ]

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background text-on-surface">
        <SideNavBar />
        
        <div className="flex-1 flex flex-col">
          <TopNavBar />
        
        <main className="flex-1 overflow-y-auto bg-surface p-8 mt-16 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <section>
              <h1 className="text-3xl font-bold mb-2">欢迎回来，学生</h1>
              <p className="text-on-surface-variant">继续你的 Docker 学习之旅</p>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-surface-container-low p-6 rounded-lg border-b-2 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-on-surface-variant text-xs font-mono uppercase">{stat.label}</span>
                    <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Labs */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">最近的实验</h2>
                <Link href="/lab" className="text-primary text-sm hover:underline">
                  查看全部 →
                </Link>
              </div>
              
              <div className="grid gap-4">
                {recentLabs.map((lab) => (
                  <div key={lab.id} className="bg-surface-container p-6 rounded-lg hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1">{lab.title}</h3>
                        <div className="flex items-center gap-2">
                          {lab.status === 'completed' && (
                            <span className="text-xs px-2 py-1 bg-secondary-container text-on-secondary rounded">已完成</span>
                          )}
                          {lab.status === 'in-progress' && (
                            <span className="text-xs px-2 py-1 bg-primary-container text-on-primary rounded">进行中</span>
                          )}
                          {lab.status === 'not-started' && (
                            <span className="text-xs px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded">未开始</span>
                          )}
                          {lab.score && (
                            <span className="text-xs font-mono text-secondary">得分: {lab.score}/100</span>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={`/lab/${lab.id}`}
                        className="px-4 py-2 bg-primary text-on-primary rounded hover:brightness-110 transition-all"
                      >
                        {lab.status === 'completed' ? '查看详情' : lab.status === 'in-progress' ? '继续实验' : '开始实验'}
                      </Link>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-on-surface-variant">完成进度</span>
                        <span className="text-primary">{lab.progress}%</span>
                      </div>
                      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${lab.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-8 rounded-lg">
                <span className="material-symbols-outlined text-primary text-4xl mb-4">add_circle</span>
                <h3 className="text-xl font-bold mb-2">开始新实验</h3>
                <p className="text-on-surface-variant mb-6">浏览可用的实验项目，选择适合你的难度</p>
                <Link 
                  href="/explore"
                  className="inline-block px-6 py-2 bg-primary text-on-primary rounded hover:brightness-110 transition-all"
                >
                  浏览课程
                </Link>
              </div>
              
              <div className="bg-surface-container-low p-8 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-4xl mb-4">school</span>
                <h3 className="text-xl font-bold mb-2">学习资源</h3>
                <p className="text-on-surface-variant mb-6">查看文档、视频教程和常见问题解答</p>
                <Link 
                  href="/docs"
                  className="inline-block px-6 py-2 border border-outline text-primary rounded hover:bg-surface-container-high transition-all"
                >
                  查看文档
                </Link>
              </div>
            </section>
          </div>
        </main>

        <StatusBar />
        </div>
      </div>
    </AuthGuard>
  )
}
