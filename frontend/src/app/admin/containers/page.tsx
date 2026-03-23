'use client'

import TopNavBar from '@/components/TopNavBar'
import SideNavBar from '@/components/SideNavBar'
import StatusBar from '@/components/StatusBar'
import AuthGuard from '@/components/AuthGuard'

export default function AdminContainerManagement() {
  const containers = [
    { id: 'c_8f29d10', name: 'api-gateway-v2', image: 'nginx:latest', cpu: 12, ram: 256, status: 'running' },
    { id: 'c_a144e52', name: 'redis-cache-layer', image: 'redis:6.2-alpine', cpu: 0.4, ram: 1200, status: 'running' },
    { id: 'c_9e110bb', name: 'analytics-worker-temp', image: 'python:3.9-slim', cpu: 0, ram: 0, status: 'stopped' },
    { id: 'c_f3922cc', name: 'frontend-canary', image: 'node:18-alpine', cpu: 42, ram: 512, status: 'running' },
  ]

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background text-on-surface">
        <SideNavBar />
      
      <div className="flex-1 flex flex-col">
        <TopNavBar />
        
        <main className="flex-1 overflow-y-auto bg-surface p-8 custom-scrollbar mt-16">
          {/* Header Section */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary text-[0.65rem] font-mono rounded">系统稳定</span>
                <span className="text-on-surface-variant text-xs font-mono">运行时间：14天 2小时 44分</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">容器管理</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-surface-container-low rounded p-1">
                <button className="px-3 py-1 bg-surface-container-highest text-primary text-xs font-medium rounded shadow-sm">全部</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface text-xs font-medium rounded">运行中</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface text-xs font-medium rounded">已停止</button>
              </div>
              <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container rounded transition-colors">refresh</button>
            </div>
          </header>

          {/* Bento Grid - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-low p-5 rounded-lg border-b-2 border-primary/30">
              <div className="flex justify-between items-start mb-4">
                <span className="text-on-surface-variant text-xs font-mono uppercase tracking-wider">容器总数</span>
                <span className="material-symbols-outlined text-primary text-xl">layers</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface">128</span>
                <span className="text-secondary text-xs">+12%</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-lg border-b-2 border-secondary/30">
              <div className="flex justify-between items-start mb-4">
                <span className="text-on-surface-variant text-xs font-mono uppercase tracking-wider">活跃内存</span>
                <span className="material-symbols-outlined text-secondary text-xl">memory</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface">42.8<span className="text-sm font-normal text-on-surface-variant"> GB</span></span>
                <span className="text-on-surface-variant text-xs">/ 128GB</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-lg border-b-2 border-tertiary/30">
              <div className="flex justify-between items-start mb-4">
                <span className="text-on-surface-variant text-xs font-mono uppercase tracking-wider">CPU 负载</span>
                <span className="material-symbols-outlined text-tertiary text-xl">speed</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface">18.4<span className="text-sm font-normal text-on-surface-variant">%</span></span>
                <span className="text-error text-xs">峰值 94%</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-lg border-b-2 border-outline-variant/30">
              <div className="flex justify-between items-start mb-4">
                <span className="text-on-surface-variant text-xs font-mono uppercase tracking-wider">网络流量</span>
                <span className="material-symbols-outlined text-outline text-xl">hub</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface">1.2<span className="text-sm font-normal text-on-surface-variant"> Gbps</span></span>
                <span className="text-secondary text-xs">正常</span>
              </div>
            </div>
          </div>

          {/* Container Management Table/Cards */}
          <div className="space-y-4">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 px-6 py-2 text-on-surface-variant text-[0.65rem] font-mono uppercase tracking-widest">
              <div className="col-span-4">容器详情</div>
              <div className="col-span-2">资源使用 (CPU/内存)</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-4 text-right">操作</div>
            </div>

            {/* Container Items */}
            {containers.map((container) => (
              <div key={container.id} className={`bg-surface-container hover:bg-surface-container-high transition-colors p-4 lg:px-6 lg:py-4 rounded-lg flex flex-col lg:grid lg:grid-cols-12 items-center gap-4 lg:gap-0 ${container.status === 'stopped' ? 'opacity-60' : ''}`}>
                <div className="col-span-4 flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary">terminal</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{container.name}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[0.7rem] font-mono text-on-surface-variant">ID: {container.id}</span>
                      <span className="text-[0.7rem] px-1.5 py-0.5 bg-surface-container-highest text-outline text-[10px] rounded uppercase">{container.image}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-4 w-full">
                  <div className="flex flex-col gap-1 w-full max-w-[120px]">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-on-surface-variant">CPU</span>
                      <span className="text-on-surface">{container.cpu}%</span>
                    </div>
                    <div className="h-1 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${container.cpu}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono mt-1">
                      <span className="text-on-surface-variant">RAM</span>
                      <span className="text-on-surface">{container.ram}MB</span>
                    </div>
                    <div className="h-1 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(container.ram / 2048) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center w-full">
                  {container.status === 'running' ? (
                    <span className="flex items-center gap-2 text-xs font-mono text-secondary">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      运行中
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs font-mono text-outline">
                      <span className="w-2 h-2 rounded-full bg-outline"></span>
                      已停止
                    </span>
                  )}
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2 w-full">
                  {container.status === 'running' ? (
                    <>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-[0.7rem] font-mono rounded transition-colors">
                        <span className="material-symbols-outlined text-sm">article</span> 日志
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-[0.7rem] font-mono rounded transition-colors">
                        <span className="material-symbols-outlined text-sm">restart_alt</span> 重启
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container/20 hover:bg-error-container text-error text-[0.7rem] font-mono rounded transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span> 停止
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container text-on-secondary text-[0.7rem] font-mono rounded transition-colors">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> 启动
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest text-on-surface text-[0.7rem] font-mono rounded transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span> 删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Terminal Area */}
          <section className="mt-12 bg-surface-container-lowest rounded border border-outline-variant/10 overflow-hidden">
            <div className="bg-surface-container px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">terminal</span>
                <span className="text-[0.7rem] font-mono text-on-surface-variant uppercase tracking-widest">全局事件与日志</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="text-[10px] font-mono text-secondary">已连接</span>
              </div>
            </div>
            <div className="p-4 font-mono text-xs leading-relaxed text-on-surface/80 max-h-48 overflow-y-auto custom-scrollbar">
              <p className="mb-1"><span className="text-outline">[2023-10-27 14:22:01]</span> <span className="text-secondary">信息</span> 容器 <span className="text-primary">api-gateway-v2</span> 健康检查通过</p>
              <p className="mb-1"><span className="text-outline">[2023-10-27 14:23:45]</span> <span className="text-tertiary">警告</span> 检测到 <span className="text-primary">redis-cache-layer</span> 内存使用率过高 (75%)</p>
              <p className="mb-1"><span className="text-outline">[2023-10-27 14:25:12]</span> <span className="text-secondary">信息</span> 部署 <span className="text-primary">frontend-canary</span> 正在扩容：+1 副本</p>
              <p className="mb-1"><span className="text-outline">[2023-10-27 14:26:00]</span> <span className="text-error-dim">错误</span> 无法从 <span className="text-primary">analytics-worker-temp</span> 获取指标 (ECONNREFUSED)</p>
              <p className="mb-1"><span className="text-outline">[2023-10-27 14:27:30]</span> <span className="text-secondary">信息</span> 系统清理任务完成。已删除 4 个悬空镜像</p>
              <p className="animate-pulse"><span className="text-primary">_</span></p>
            </div>
          </section>
        </main>

        <StatusBar />
        </div>
      </div>
    </AuthGuard>
  )
}
