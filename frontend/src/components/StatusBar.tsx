'use client'

export default function StatusBar() {
  return (
    <footer className="fixed bottom-0 w-full h-6 bg-primary-container text-on-primary-container flex items-center justify-between px-4 text-[10px] font-mono z-50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-pulse"></span> 
          系统状态：正常
        </span>
        <span className="opacity-70">区域：华东-1</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="opacity-70">版本 v4.2.1-stable</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">code</span> 
          专业模式
        </span>
      </div>
    </footer>
  )
}
