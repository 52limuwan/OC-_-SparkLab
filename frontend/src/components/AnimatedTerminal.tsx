'use client'

import { useEffect, useState } from 'react'

interface TerminalLine {
  text: string
  color: string
  delay: number
  speed?: number // 打字速度（毫秒/字符）
  prefix?: string // 前缀（如 $ 或缩进）
}

const terminalLines: TerminalLine[] = [
  { text: 'docker run -d --name nginx-lab nginx:latest', color: 'text-white/90', delay: 500, speed: 30, prefix: '$ ' },
  { text: 'Unable to find image \'nginx:latest\' locally', color: 'text-white/60', delay: 400, speed: 10, prefix: '  ' },
  { text: 'latest: Pulling from library/nginx', color: 'text-white/60', delay: 200, speed: 10, prefix: '  ' },
  { text: 'a2abf6c4d29d: Pull complete', color: 'text-blue-400', delay: 600, speed: 5, prefix: '  ' },
  { text: 'a9edb18cadd1: Pull complete', color: 'text-blue-400', delay: 400, speed: 5, prefix: '  ' },
  { text: '589b7251471a: Pull complete', color: 'text-blue-400', delay: 500, speed: 5, prefix: '  ' },
  { text: 'Digest: sha256:0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31', color: 'text-green-400', delay: 300, speed: 3, prefix: '  ' },
  { text: 'Status: Downloaded newer image for nginx:latest', color: 'text-green-400', delay: 100, speed: 8, prefix: '  ' },
  { text: 'f8a9c3e5d7b2a1c4e6f8d9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0', color: 'text-white/90', delay: 200, speed: 2, prefix: '  ' },
  { text: '', color: '', delay: 800, speed: 0, prefix: '' }, // 空行
  { text: 'docker ps', color: 'text-white/90', delay: 600, speed: 40, prefix: '$ ' },
  { text: 'CONTAINER ID   IMAGE          STATUS         PORTS      NAMES', color: 'text-white/50', delay: 200, speed: 5, prefix: '  ' },
  { text: 'f8a9c3e5d7b2   nginx:latest   Up 2 seconds   80/tcp     nginx-lab', color: 'text-white/90', delay: 100, speed: 5, prefix: '  ' },
]

export default function AnimatedTerminal() {
  const [lines, setLines] = useState<Array<{ text: string; color: string; prefix: string }>>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) {
      // 动画完成，显示最终光标
      const timer = setTimeout(() => {
        // 重新开始
        setLines([])
        setCurrentLineIndex(0)
        setCurrentText('')
      }, 3000)
      return () => clearTimeout(timer)
    }

    const line = terminalLines[currentLineIndex]
    
    // 等待延迟后开始打字
    const delayTimer = setTimeout(() => {
      if (line.text === '') {
        // 空行直接添加
        setLines(prev => [...prev, { text: '', color: '', prefix: '' }])
        setCurrentLineIndex(prev => prev + 1)
        return
      }

      let charIndex = 0
      const typeInterval = setInterval(() => {
        if (charIndex <= line.text.length) {
          setCurrentText(line.text.substring(0, charIndex))
          charIndex++
        } else {
          // 完成当前行
          clearInterval(typeInterval)
          setLines(prev => [...prev, { 
            text: line.text, 
            color: line.color,
            prefix: line.prefix || ''
          }])
          setCurrentText('')
          setCurrentLineIndex(prev => prev + 1)
        }
      }, line.speed || 20)

      return () => clearInterval(typeInterval)
    }, line.delay)

    return () => clearTimeout(delayTimer)
  }, [currentLineIndex])

  // 光标闪烁
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* 终端头部 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
          </div>
          <div className="flex-1 text-center text-xs text-white/50 font-mono">
            terminal — docker@lab-001
          </div>
        </div>
        
        {/* 终端内容 */}
        <div className="p-6 font-mono text-sm min-h-[400px]">
          {lines.map((line, index) => (
            <div key={index} className={`${line.color} leading-relaxed`}>
              {line.prefix && <span className={line.prefix.includes('$') ? 'text-green-400' : ''}>{line.prefix}</span>}
              {line.text}
            </div>
          ))}
          
          {/* 当前正在打字的行 */}
          {currentText && currentLineIndex < terminalLines.length && (
            <div className={`${terminalLines[currentLineIndex].color} leading-relaxed`}>
              {terminalLines[currentLineIndex].prefix && (
                <span className={terminalLines[currentLineIndex].prefix?.includes('$') ? 'text-green-400' : ''}>
                  {terminalLines[currentLineIndex].prefix}
                </span>
              )}
              {currentText}
              {showCursor && <span className="bg-white/90 ml-0.5">▋</span>}
            </div>
          )}
          
          {/* 最终光标 */}
          {currentLineIndex >= terminalLines.length && (
            <div className="leading-relaxed mt-2">
              <span className="text-green-400">$ </span>
              {showCursor && <span className="bg-white/90">▋</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
