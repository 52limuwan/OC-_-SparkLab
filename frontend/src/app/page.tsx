'use client'

import { useRef, useEffect } from 'react'
import TopNavBar from '@/components/TopNavBar'
import ParticleBackground from '@/components/ParticleBackground'
import AnimatedTerminal from '@/components/AnimatedTerminal'

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const fadeOutStart = video.duration - 0.5
      const fadeInEnd = 0.5

      if (video.currentTime >= fadeOutStart) {
        const opacity = 1 - (video.currentTime - fadeOutStart) / 0.5
        video.style.opacity = Math.max(0, opacity).toString()
      } else if (video.currentTime <= fadeInEnd) {
        const opacity = video.currentTime / fadeInEnd
        video.style.opacity = Math.min(1, opacity).toString()
      } else {
        video.style.opacity = '1'
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])

  return (
    <div className="relative min-h-screen bg-black text-white font-body">
      <TopNavBar />
      
      <main className="relative">
        <section className="relative overflow-hidden h-screen flex items-center justify-center px-6">
          <div className="absolute inset-0 z-0">
            <video 
              ref={videoRef}
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover transition-opacity duration-500"
            >
              <source src="/video.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="absolute inset-0 z-0">
            <ParticleBackground />
          </div>

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
