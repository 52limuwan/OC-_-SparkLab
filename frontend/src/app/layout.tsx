import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Docker 实训平台 | 在线容器化教学系统',
  description: '面向计算机专业学生的在线实训平台。在安全隔离的环境中，快速部署容器，完成实验任务，提升实践能力。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="selection:bg-primary selection:text-on-primary">{children}</body>
    </html>
  )
}
