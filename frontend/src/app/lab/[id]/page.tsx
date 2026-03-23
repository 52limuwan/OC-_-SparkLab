'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import TopNavBar from '@/components/TopNavBar'
import SideNavBar from '@/components/SideNavBar'
import StatusBar from '@/components/StatusBar'
import AuthGuard from '@/components/AuthGuard'

export default function LabDetailsPage() {
  const params = useParams()
  const labId = params.id

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background text-on-surface">
      <SideNavBar />
      
      <div className="flex-1 flex flex-col">
        <TopNavBar />
        
        <main className="flex-1 overflow-y-auto bg-surface p-6 md:p-10 lg:p-12 mt-16 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 space-y-10">
                <header>
                  <div className="flex items-center gap-2 text-primary font-mono text-sm mb-4">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span className="tracking-widest uppercase">课程模块 04</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold font-headline text-on-surface tracking-tight mb-6 leading-tight">
                    高级 Nginx 配置实验
                  </h1>
                  <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
                    掌握高性能 Web 服务的精髓。学习优化缓冲区大小、实现复杂的负载均衡策略，以及使用高级 TLS 终止保护你的基础设施。
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-lg border-l-2 border-primary/30">
                    <div className="text-on-surface-variant text-xs font-mono mb-2 uppercase tracking-tighter">难度等级</div>
                    <div className="flex items-center gap-2 text-tertiary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
                      <span className="font-bold text-lg">进阶</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-lg border-l-2 border-secondary/30">
                    <div className="text-on-surface-variant text-xs font-mono mb-2 uppercase tracking-tighter">预计时长</div>
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                      <span className="font-bold text-lg">120 分钟</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-lg border-l-2 border-outline/30">
                    <div className="text-on-surface-variant text-xs font-mono mb-2 uppercase tracking-tighter">实验类型</div>
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>view_in_ar</span>
                      <span className="font-bold text-lg">交互式实验</span>
                    </div>
                  </div>
                </div>

                <section className="space-y-6">
                  <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">target</span>
                    学习目标
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      '实现上游健康检查以构建高可用集群',
                      '配置动态模块加载，无需服务停机',
                      '优化 worker_connections 和 rlimit 以应对高峰流量',
                      '应用 HTTP/2 和 OCSP Stapling 提升性能'
                    ].map((objective, index) => (
                      <div key={index} className="bg-surface-container p-5 rounded flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                        <span className="text-on-surface-variant text-sm leading-relaxed">{objective}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <h3 className="text-xl font-bold mb-2">准备开始实验？</h3>
                      <p className="text-on-surface-variant text-sm">容器将在华东-1区域部署</p>
                    </div>
                    <Link 
                      href="/lab"
                      className="bg-gradient-to-b from-primary to-primary-dim text-on-primary px-8 py-4 font-bold text-lg rounded shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      开始实验
                    </Link>
                  </div>
                </section>
              </div>

              <aside className="w-full lg:w-80 space-y-8">
                <div className="bg-surface-container-high rounded-lg p-6 border border-outline-variant/20">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">settings_input_component</span>
                    资源限制
                  </h4>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-mono">
                        <span>CPU 分配</span>
                        <span className="text-secondary">0.5 VCPU</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-mono">
                        <span>内存限制</span>
                        <span className="text-primary">512MB RAM</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[40%]"></div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="bg-surface-container p-3 rounded font-mono text-[0.7rem] text-on-surface-variant/80 border border-outline-variant/10">
                        <span className="text-secondary">$</span> kubectl describe pod nginx-lab
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-lg p-6">
                  <h4 className="font-bold text-on-surface mb-6 flex items-center justify-between">
                    课程大纲
                    <span className="text-[0.65rem] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">6 阶段</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { stage: '01', title: '基础安装', status: 'completed' },
                      { stage: '02', title: '流模块配置', status: 'active' },
                      { stage: '03', title: 'Worker 优化', status: 'locked' },
                      { stage: '04', title: '安全加固', status: 'locked' },
                      { stage: '05', title: 'Lua 脚本', status: 'locked' },
                      { stage: '06', title: '最终项目', status: 'locked' }
                    ].map((item) => (
                      <div 
                        key={item.stage}
                        className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer ${
                          item.status === 'completed' 
                            ? 'bg-surface-container border-outline-variant/10' 
                            : item.status === 'active'
                            ? 'bg-surface-container-high border-primary/30'
                            : 'hover:bg-surface-container border-transparent'
                        }`}
                      >
                        <span className={`text-xs font-mono ${item.status === 'active' ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {item.stage}
                        </span>
                        <span className={`text-sm ${item.status === 'active' ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                          {item.title}
                        </span>
                        <span className="material-symbols-outlined ml-auto text-sm" style={item.status === 'completed' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {item.status === 'completed' ? 'check_circle' : item.status === 'active' ? 'play_circle' : 'lock'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-error-container/10 border border-error-container/20 rounded-lg">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-error-dim" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <p className="text-xs text-on-surface-variant leading-tight">
                      <strong className="text-error-dim block mb-1">前置要求检查</strong>
                      请确保你已完成"Nginx 基础"课程后再开始此进阶模块。
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>

        <StatusBar />
      </div>
    </div>
    </AuthGuard>
  )
}
