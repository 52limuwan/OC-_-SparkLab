'use client'

import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  baseX: number
  baseY: number
  baseOpacity: number
  currentOpacity: number
  offsetX: number
  offsetY: number
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 初始化点阵 - 必须在 resizeCanvas 之前声明
    const initDots = () => {
      const dots: Dot[] = []
      const spacing = 10 // 点之间的间距（超级密集）
      const cols = Math.ceil(canvas.width / spacing)
      const rows = Math.ceil(canvas.height / spacing)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + spacing / 2
          const y = j * spacing + spacing / 2
          const baseOpacity = Math.random() * 0.1 + 0.03 // 0.03 - 0.13 (非常透明)
          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            baseOpacity,
            currentOpacity: baseOpacity,
            offsetX: 0,
            offsetY: 0,
          })
        }
      }
      dotsRef.current = dots
    }

    // 设置 canvas 尺寸 - 在 initDots 之后声明
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDots()
    }

    // 初始化
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // 鼠标离开事件
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }
    window.addEventListener('mouseleave', handleMouseLeave)

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const dots = dotsRef.current
      const mouse = mouseRef.current
      const pushRadius = 150 // 推开半径
      const fadeRadius = 100 // 淡化半径

      dots.forEach((dot) => {
        // 计算与鼠标的距离
        const dx = dot.baseX - mouse.x
        const dy = dot.baseY - mouse.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 推开效果 - 向外散开
        if (distance < pushRadius) {
          const force = (pushRadius - distance) / pushRadius
          const pushStrength = force * 30 // 推开强度
          
          // 计算推开方向（从鼠标指向点的方向）
          const angle = Math.atan2(dy, dx)
          const targetOffsetX = Math.cos(angle) * pushStrength
          const targetOffsetY = Math.sin(angle) * pushStrength
          
          // 平滑过渡
          dot.offsetX += (targetOffsetX - dot.offsetX) * 0.2
          dot.offsetY += (targetOffsetY - dot.offsetY) * 0.2
          
          // 中心区域淡化效果
          if (distance < fadeRadius) {
            const fadeForce = 1 - (distance / fadeRadius)
            dot.currentOpacity = dot.baseOpacity * (1 - fadeForce * 0.8)
          } else {
            dot.currentOpacity += (dot.baseOpacity - dot.currentOpacity) * 0.1
          }
        } else {
          // 恢复原位
          dot.offsetX += (0 - dot.offsetX) * 0.1
          dot.offsetY += (0 - dot.offsetY) * 0.1
          dot.currentOpacity += (dot.baseOpacity - dot.currentOpacity) * 0.1
        }

        // 更新点的位置
        dot.x = dot.baseX + dot.offsetX
        dot.y = dot.baseY + dot.offsetY

        // 绘制点 - 白色
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.currentOpacity})`
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    // 清理
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-100 transition-opacity duration-1000">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0"
      />
    </div>
  )
}
