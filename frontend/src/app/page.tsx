'use client'

import Link from 'next/link'
import TopNavBar from '@/components/TopNavBar'
import StatusBar from '@/components/StatusBar'
import ParticleBackground from '@/components/ParticleBackground'
import AnimatedTerminal from '@/components/AnimatedTerminal'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white font-body">
      <TopNavBar />
      
      <main className="relative">
        {/* Hero Section - 第一屏带视频和点点 */}
        <section className="relative overflow-hidden h-screen flex items-center justify-center px-6">
          {/* 视频背景 */}
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>
          </div>

          {/* 粒子背景 - 只在第一屏 */}
          <div className="absolute inset-0 z-0">
            <ParticleBackground />
          </div>

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="text-center mb-16">
              <h1 className="text-6xl lg:text-8xl font-bold font-headline leading-[1.1] mb-8">
                Docker 实训平台
              </h1>
              <p className="text-xl lg:text-2xl text-white/70 mb-12 max-w-3xl mx-auto">
                面向计算机专业学生的在线实训平台<br/>
                在安全隔离的环境中，快速部署容器，完成实验任务
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Link 
                  href="/lab" 
                  className="bg-white text-black px-10 py-5 font-bold rounded-full text-lg hover:bg-white/90 transition-all inline-flex items-center justify-center gap-3"
                >
                  开始第一个实验
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link 
                  href="/explore" 
                  className="border-2 border-white/20 text-white px-10 py-5 font-bold rounded-full text-lg hover:bg-white/5 transition-all"
                >
                  浏览实验课程
                </Link>
              </div>
            </div>

            {/* 动画终端 */}
            <AnimatedTerminal />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">terminal</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">实时终端</h3>
                <p className="text-white/60 text-lg">
                  提供低延迟的命令行访问，支持完整的 Linux 操作
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">shield</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">安全隔离</h3>
                <p className="text-white/60 text-lg">
                  每个学生拥有独立的容器环境，内核级隔离确保实验互不干扰
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">hub</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">多人协作</h3>
                <p className="text-white/60 text-lg">
                  支持班级统一管理，教师可以实时查看学生实验进度
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">5000+</div>
              <div className="text-sm uppercase tracking-widest text-white/50">学生用户</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-sm uppercase tracking-widest text-white/50">实验项目</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-sm uppercase tracking-widest text-white/50">环境隔离</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-sm uppercase tracking-widest text-white/50">在线服务</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-bold mb-8">
              开始你的实训之旅
            </h2>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              加入数千名学生，在实践中掌握 Docker 容器技术<br/>
              无需安装任何软件，立即开始第一个实验
            </p>
            <Link 
              href="/lab" 
              className="bg-white text-black px-12 py-6 font-bold rounded-full text-xl hover:bg-white/90 transition-all inline-flex items-center gap-3"
            >
              立即开始实验
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>

      <StatusBar />
    </div>
  )
}
