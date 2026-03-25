'use client'

import TopNavBar from '@/components/TopNavBar'
import ParticleBackground from '@/components/ParticleBackground'
import AnimatedTerminal from '@/components/AnimatedTerminal'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white font-body">
      <TopNavBar />
      
      <main className="relative">
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

          {/* 粒子背景 */}
          <div className="absolute inset-0 z-0">
            <ParticleBackground />
          </div>

          {/* 主要内容 */}
          <div className="max-w-7xl mx-auto w-full relative z-10 pt-24">
            <div className="text-center mb-12">
              <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-[1.1] mb-6">
                在实践中掌握未来
              </h1>
              <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                面向[星火工作坊]学员的技能实验室<br/>
                处于安全隔离的环境中，自主部署，高效完成实验任务
              </p>
            </div>

            <AnimatedTerminal />
          </div>
        </section>
      </main>
    </div>
  )
}
