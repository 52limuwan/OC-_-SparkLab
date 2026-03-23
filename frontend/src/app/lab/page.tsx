'use client'

import { useState } from 'react'
import TopNavBar from '@/components/TopNavBar'
import Terminal from '@/components/Terminal'
import AuthGuard from '@/components/AuthGuard'

export default function LabWorkspace() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'vnc'>('terminal')
  const [progress, setProgress] = useState(25)
  const [completedSteps, setCompletedSteps] = useState([false, false, false, false])

  const toggleStep = (index: number) => {
    const newSteps = [...completedSteps]
    newSteps[index] = !newSteps[index]
    setCompletedSteps(newSteps)
    const completed = newSteps.filter(Boolean).length
    setProgress((completed / newSteps.length) * 100)
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background text-on-surface">
      <TopNavBar />
      
      <main className="flex h-[calc(100vh-64px)] w-full overflow-hidden mt-16">
        {/* Left Pane: Lab Instructions */}
        <aside className="w-1/3 min-w-[320px] max-w-lg bg-surface-container-low border-r border-outline-variant/20 flex flex-col">
          <div className="p-6 border-b border-outline-variant/10">
            <div className="flex items-center gap-2 text-xs font-mono text-primary mb-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              课程：Docker 网络配置
            </div>
            <h1 className="text-xl font-bold text-on-surface leading-tight">实验 01：Nginx 容器部署</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <article className="prose prose-invert max-w-none text-sm leading-relaxed text-on-surface-variant">
              <h3 className="text-on-surface font-semibold text-base mt-0">实验概述</h3>
              <p>在本实验中，你将部署一个 Nginx Web 服务器容器，并配置自定义的静态网页。你将学习如何映射数据卷，以及如何将容器端口暴露给主机。</p>
              
              <div className="my-6 p-4 bg-surface-container rounded border-l-4 border-primary/40 italic">
                &quot;容器化不仅仅是隔离，更是创建可复现的运行环境。&quot;
              </div>
              
              <h3 className="text-on-surface font-semibold text-base">实验步骤</h3>
              <div className="space-y-4 mt-4">
                {[
                  { title: '1. 拉取官方 Nginx 镜像', code: 'docker pull nginx:latest' },
                  { title: '2. 创建本地内容目录', desc: '在你的主目录下创建一个名为 html 的文件夹' },
                  { title: '3. 运行容器并映射数据卷', code: 'docker run -d -p 8080:80 --name my-web -v ~/html:/usr/share/nginx/html nginx' },
                  { title: '4. 验证访问', desc: '通过浏览器访问 localhost:8080，确认你的自定义 index.html 已生效' }
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-high transition-colors group">
                    <input 
                      className="mt-1 w-4 h-4 rounded-sm bg-surface-container border-outline text-secondary focus:ring-secondary/20 cursor-pointer" 
                      type="checkbox"
                      checked={completedSteps[index]}
                      onChange={() => toggleStep(index)}
                    />
                    <div className="text-xs flex-1">
                      <span className="block font-medium text-on-surface group-hover:text-primary transition-colors">{step.title}</span>
                      {step.code && (
                        <code className="block mt-1 bg-surface-container-lowest p-2 rounded font-mono text-secondary-fixed opacity-80">{step.code}</code>
                      )}
                      {step.desc && (
                        <p className="mt-1 text-on-surface-variant/70">{step.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
          
          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex flex-col gap-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono uppercase tracking-tighter text-on-surface-variant">完成进度：{Math.round(progress)}%</span>
              <span className="text-[10px] font-mono text-primary">{completedSteps.filter(Boolean).length} / {completedSteps.length} 已完成</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <button className="mt-2 w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary py-2.5 rounded font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-[0.98] transition-all">
              提交实验报告
            </button>
            <button className="w-full bg-surface-container-high text-on-surface-variant py-2 rounded font-medium text-xs border border-outline-variant/20 hover:text-on-surface transition-colors">
              向 AI 助手提问
            </button>
          </div>
        </aside>

        {/* Right Pane: Interactive Terminal/Desktop Area */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest relative">
          {/* Workspace Tab Bar */}
          <div className="h-10 bg-surface-container border-b border-outline-variant/10 flex items-center px-4 gap-1">
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-2 px-4 h-full text-[11px] font-mono tracking-wide ${
                activeTab === 'terminal' 
                  ? 'bg-surface-container-lowest text-primary border-t-2 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high transition-colors'
              }`}
            >
              <span className="material-symbols-outlined text-xs">terminal</span>
              终端
              {activeTab === 'terminal' && <span className="material-symbols-outlined text-[10px] ml-2 opacity-50">close</span>}
            </button>
            <button 
              onClick={() => setActiveTab('vnc')}
              className={`flex items-center gap-2 px-4 h-full text-[11px] font-mono tracking-wide ${
                activeTab === 'vnc' 
                  ? 'bg-surface-container-lowest text-primary border-t-2 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high transition-colors'
              }`}
            >
              <span className="material-symbols-outlined text-xs">monitor</span>
              远程桌面
              {activeTab === 'vnc' && <span className="material-symbols-outlined text-[10px] ml-2 opacity-50">close</span>}
            </button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-mono border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                已连接
              </div>
              <button className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">help</span>
              </button>
              <button className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">fullscreen</span>
              </button>
            </div>
          </div>

          {/* Terminal Area (Active) */}
          {activeTab === 'terminal' && (
            <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed custom-scrollbar overflow-y-auto bg-black">
              <Terminal />
            </div>
          )}

          {/* Remote Desktop (Placeholder) */}
          {activeTab === 'vnc' && (
            <div className="flex-1 bg-surface-container-low flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-6xl text-primary opacity-30">desktop_windows</span>
                <p className="text-on-surface-variant font-mono text-sm">VNC 会话未激活</p>
              </div>
            </div>
          )}

          {/* Terminal Toolbar / Status */}
          <div className="h-8 bg-primary-container flex items-center px-4 justify-between select-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-primary-container">
                <span className="material-symbols-outlined text-[14px]">dns</span>
                容器：my-lab-instance
              </div>
              <div className="h-3 w-[1px] bg-on-primary-container/20"></div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-primary-container">
                <span className="material-symbols-outlined text-[14px]">memory</span>
                CPU: 12%
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-primary-container">
                <span className="material-symbols-outlined text-[14px]">equalizer</span>
                内存: 452MB / 2GB
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-on-primary-container uppercase tracking-tighter">区域：华东-1</span>
              <span className="material-symbols-outlined text-[14px] text-on-primary-container">wifi</span>
            </div>
          </div>
        </section>
      </main>
    </div>
    </AuthGuard>
  )
}
