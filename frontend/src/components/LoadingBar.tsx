'use client';

export default function LoadingBar() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-80 space-y-3">
        {/* 主加载条 */}
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-loading-slide"
            style={{
              boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)',
            }}
          />
        </div>
        
        {/* 可选：品牌文字 */}
        <div className="text-center">
          <p className="text-sm text-on-surface-variant/50 tracking-wider">星火实验室</p>
        </div>
      </div>
    </div>
  );
}
