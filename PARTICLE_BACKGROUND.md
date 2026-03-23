# 🌟 交互式粒子背景

## 功能说明

为首页添加了类似 Stitch 的交互式粒子背景效果，提升视觉体验。

## 特性

### 1. 粒子系统
- 动态生成的粒子网络
- 粒子数量根据屏幕尺寸自适应
- 粒子随机运动，边界反弹

### 2. 鼠标交互
- 鼠标靠近时粒子会被推开（斥力效果）
- 交互范围：150px
- 粒子在鼠标附近会高亮发光

### 3. 连线效果
- 距离小于 120px 的粒子之间会绘制连线
- 连线透明度随距离变化
- 创造动态的网络视觉效果

### 4. 性能优化
- 使用 `requestAnimationFrame` 实现流畅动画
- 响应式设计，自动适配屏幕尺寸
- 组件卸载时自动清理资源

## 文件结构

```
frontend/src/
├── components/
│   └── ParticleBackground.tsx    # 粒子背景组件
└── app/
    └── page.tsx                   # 首页（已集成）
```

## 使用方法

### 在任何页面中使用

```tsx
import ParticleBackground from '@/components/ParticleBackground'

export default function MyPage() {
  return (
    <div className="relative min-h-screen">
      {/* 粒子背景 */}
      <ParticleBackground />
      
      {/* 页面内容 */}
      <div className="relative z-10">
        <h1>你的内容</h1>
      </div>
    </div>
  )
}
```

## 样式说明

### 颜色
- 粒子颜色：`rgba(163, 166, 255, opacity)` (primary 色)
- 可以在组件中修改颜色以匹配不同主题

### 透明度
- 粒子基础透明度：0.3 - 0.8
- 连线透明度：0 - 0.15
- 鼠标交互高亮：0 - 0.6

### 尺寸
- 粒子半径：0.5 - 2px
- 高亮光晕：+2px

## 自定义参数

在 `ParticleBackground.tsx` 中可以调整以下参数：

```typescript
// 粒子数量（基于屏幕面积）
const particleCount = Math.floor((canvas.width * canvas.height) / 15000)

// 粒子速度
vx: (Math.random() - 0.5) * 0.3
vy: (Math.random() - 0.5) * 0.3

// 鼠标交互范围
const maxDistance = 150

// 连线距离
if (distance < 120) { ... }

// 斥力强度
particle.x -= (dx / distance) * force * 2
```

## 性能考虑

### 粒子数量
- 默认：屏幕面积 / 15000
- 1920x1080 屏幕约 138 个粒子
- 可根据性能需求调整除数

### 优化建议
1. 减少粒子数量（增大除数）
2. 减少连线检测范围
3. 降低动画帧率（不推荐）

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 效果预览

### 静态状态
- 粒子在画布上随机分布
- 粒子缓慢移动
- 附近粒子之间有淡淡的连线

### 鼠标交互
- 鼠标移动到粒子附近
- 粒子被推开（斥力效果）
- 粒子高亮发光
- 连线动态变化

## 技术实现

### Canvas API
- 使用 HTML5 Canvas 绘制
- 2D 渲染上下文
- 实时动画更新

### React Hooks
- `useRef` - 存储 canvas 引用和粒子数据
- `useEffect` - 初始化和清理
- `requestAnimationFrame` - 动画循环

### 数学计算
- 距离计算：`Math.sqrt(dx * dx + dy * dy)`
- 斥力计算：基于距离的反比例函数
- 边界检测：速度反转

## 故障排查

### 问题：粒子不显示
**解决方案：**
1. 检查 canvas 尺寸是否正确
2. 确认 z-index 层级
3. 查看浏览器控制台错误

### 问题：性能卡顿
**解决方案：**
1. 减少粒子数量
2. 减少连线检测范围
3. 降低粒子移动速度

### 问题：鼠标交互不灵敏
**解决方案：**
1. 增大 `maxDistance` 值
2. 增强斥力强度
3. 检查鼠标事件监听

## 未来改进

- [ ] 添加颜色主题切换
- [ ] 支持触摸设备交互
- [ ] 添加粒子吸引力模式
- [ ] 性能监控和自适应调整
- [ ] 添加粒子爆炸效果
- [ ] 支持自定义粒子形状

## 灵感来源

设计灵感来自 Google Stitch 的交互式背景效果，结合了：
- 粒子系统
- 鼠标交互
- 动态连线
- 流畅动画

---

**创建日期**: 2024年  
**作者**: Kiro AI Assistant  
**版本**: 1.0.0
