'use client'

import TopNavBar from '@/components/TopNavBar'
import SideNavBar from '@/components/SideNavBar'
import StatusBar from '@/components/StatusBar'
import AuthGuard from '@/components/AuthGuard'

export default function ProfilePage() {
  const skills = [
    { name: '容器安全', level: 8, maxLevel: 10, color: 'bg-secondary' },
    { name: '云架构', level: 5, maxLevel: 10, color: 'bg-primary' },
    { name: '网络配置', level: 6, maxLevel: 10, color: 'bg-tertiary' },
  ]

  const recentActivity = [
    { id: 'L-0024', title: '后量子密码学实验', status: '已完成', score: 98, rank: 'S', time: '2小时前' },
    { id: 'L-0019', title: '多集群 Kubernetes 网格', status: '已完成', score: 84, rank: 'A', time: '昨天' },
    { id: 'L-0015', title: 'Docker Swarm 集群', status: '已完成', score: 92, rank: 'A', time: '3天前' },
  ]

  const badges = [
    { name: '零日英雄', icon: 'workspace_premium', unlocked: true, color: 'from-tertiary-dim to-tertiary' },
    { name: '延迟之王', icon: 'speed', unlocked: true, color: 'from-primary to-primary-dim' },
    { name: '神秘徽章', icon: 'lock', unlocked: false, color: 'from-outline to-outline-variant' },
    { name: '神秘徽章', icon: 'lock', unlocked: false, color: 'from-outline to-outline-variant' },
  ]

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background text-on-surface">
        <SideNavBar />
      
      <div className="flex-1 flex flex-col">
        <TopNavBar />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-surface mt-16 custom-scrollbar">
          {/* Hero Header Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col justify-end bg-surface-container-low p-8 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[12rem]">verified_user</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-bold text-on-surface">张三同学</h1>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary rounded text-xs font-mono">精英学员</span>
                </div>
                <div className="flex flex-wrap gap-8 text-sm">
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant font-mono uppercase tracking-widest text-[0.625rem]">等级</span>
                    <span className="text-primary font-bold">Lvl 12 高级工程师</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant font-mono uppercase tracking-widest text-[0.625rem]">完成率</span>
                    <span className="text-on-surface">85.2%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant font-mono uppercase tracking-widest text-[0.625rem]">加入时间</span>
                    <span className="text-on-surface">2024年9月</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container p-6 rounded-lg flex flex-col justify-between border-l-4 border-primary">
              <div>
                <h3 className="text-sm font-mono text-primary uppercase tracking-tighter mb-4">经验值系统</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-on-surface-variant">下一等级：1,450 XP</span>
                      <span className="text-primary">82%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary-dim w-[82%]"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-3 rounded">
                      <p className="text-[0.625rem] text-on-surface-variant uppercase">已完成实验</p>
                      <p className="text-2xl font-bold font-mono">28</p>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded">
                      <p className="text-[0.625rem] text-on-surface-variant uppercase">在线时长</p>
                      <p className="text-2xl font-bold font-mono">48h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid Main Content */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Skill Tree / Path */}
            <div className="lg:col-span-5 bg-surface-container-low rounded-lg p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold">技能树</h2>
                <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-help">info</span>
              </div>
              <div className="space-y-8 relative">
                {/* Connecting Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-outline-variant opacity-30"></div>
                
                {/* Skill Nodes */}
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-6 relative z-10">
                    <div className={`w-12 h-12 rounded ${skill.level === skill.maxLevel ? 'bg-secondary-container border border-secondary' : 'bg-surface-container-highest border border-primary'} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${skill.level === skill.maxLevel ? 'text-secondary' : 'text-primary'}`}>
                        {skill.level === skill.maxLevel ? 'security' : skill.name === '云架构' ? 'cloud' : 'database'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-bold">{skill.name}</h4>
                        <span className={`text-[0.625rem] font-mono ${skill.level === skill.maxLevel ? 'text-secondary' : 'text-primary'}`}>
                          LVL {skill.level} / {skill.maxLevel}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-container-highest rounded-full">
                        <div className={`h-full ${skill.color}`} style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed / Lab History */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-surface-container rounded-lg overflow-hidden border border-outline-variant/10">
                <div className="p-4 bg-surface-container-high flex justify-between items-center border-b border-outline-variant/20">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">history</span>
                    最近完成的实验
                  </h3>
                  <button className="text-[0.625rem] font-mono text-on-surface-variant hover:text-on-surface uppercase tracking-widest">
                    下载报告
                  </button>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-surface-container-highest/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-[0.75rem] font-mono text-on-surface-variant">#{item.id}</span>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-[0.625rem] text-on-surface-variant font-mono">{item.status}：{item.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${item.rank === 'S' ? 'text-secondary' : 'text-primary'}`}>
                          {item.score}/100
                        </div>
                        <div className={`text-[0.625rem] px-2 py-0.5 rounded uppercase ${
                          item.rank === 'S' ? 'bg-secondary-container text-on-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {item.rank}-等级
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earned Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge, index) => (
                  <div 
                    key={index} 
                    className={`bg-surface-container-low p-4 rounded-lg flex flex-col items-center text-center gap-2 border border-outline-variant/10 group cursor-default ${
                      !badge.unlocked && 'opacity-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${badge.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-on-primary" style={badge.unlocked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {badge.icon}
                      </span>
                    </div>
                    <span className="text-[0.625rem] font-bold uppercase tracking-tighter">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom Settings Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-outline-variant/10">
            {/* Account Settings */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                账户设置
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[0.625rem] font-mono text-on-surface-variant uppercase ml-1">用户名</label>
                  <input className="w-full bg-surface-container-high border-none rounded focus:ring-2 focus:ring-primary text-sm p-2.5 font-mono" type="text" defaultValue="张三" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.625rem] font-mono text-on-surface-variant uppercase ml-1">邮箱</label>
                  <input className="w-full bg-surface-container-high border-none rounded focus:ring-2 focus:ring-primary text-sm p-2.5 font-mono" type="email" defaultValue="zhangsan@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[0.625rem] font-mono text-on-surface-variant uppercase ml-1">学号</label>
                  <input className="w-full bg-surface-container-high border-none rounded focus:ring-2 focus:ring-primary text-sm p-2.5 font-mono" type="text" defaultValue="2024001" />
                </div>
                <div className="flex items-end pb-1 px-1">
                  <button className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                    修改密码 <span className="material-symbols-outlined text-sm">key</span>
                  </button>
                </div>
              </div>
            </div>

            {/* API Key Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">api</span>
                  API 密钥
                </h2>
                <button className="bg-secondary-container text-on-secondary text-[0.625rem] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  轮换密钥
                </button>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg font-mono border border-secondary/10 relative overflow-hidden">
                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-surface-container rounded border-l-2 border-secondary">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[0.625rem] text-on-surface-variant uppercase">开发环境</span>
                      <span className="text-[0.625rem] text-secondary">活跃</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm tracking-widest truncate">dl_live_4992_xk39_0092_mj812</span>
                      <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface text-lg">content_copy</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-container rounded border-l-2 border-outline-variant">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[0.625rem] text-on-surface-variant uppercase">CLI 集成</span>
                      <span className="text-[0.625rem] text-on-surface-variant">已撤销</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 opacity-40">
                      <span className="text-sm tracking-widest truncate">dl_test_8821_ak11_9901_zz210</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">lock_reset</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <StatusBar />
        </div>
      </div>
    </AuthGuard>
  )
}
