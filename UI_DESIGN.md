# 🎨 UI 设计说明

## 设计理念

### 核心原则
- **专业**: VS Code 风格，开发者友好
- **简洁**: 去除冗余，突出核心功能
- **现代**: 深色主题，流畅动画
- **高效**: 快速响应，直观操作

## 配色方案

### 主色调 (深色主题)

```css
/* 背景色 */
--bg-primary: #1e1e1e;      /* 主背景 - 深灰 */
--bg-secondary: #2d2d2d;    /* 次级背景 - 中灰 */
--bg-tertiary: #252526;     /* 三级背景 */

/* 文字色 */
--text-primary: #d4d4d4;    /* 主文字 - 浅灰 */
--text-secondary: #9ca3af;  /* 次级文字 */
--text-muted: #6b7280;      /* 弱化文字 */

/* 边框色 */
--border-primary: #3e3e3e;  /* 主边框 */
--border-secondary: #2d2d2d; /* 次级边框 */

/* 强调色 */
--accent-blue: #0ea5e9;     /* 蓝色 - 主要操作 */
--accent-green: #10b981;    /* 绿色 - 成功状态 */
--accent-red: #ef4444;      /* 红色 - 危险操作 */
--accent-yellow: #f59e0b;   /* 黄色 - 警告提示 */
--accent-purple: #8b5cf6;   /* 紫色 - 特殊标记 */
```

### 终端配色

```css
/* 终端主题 (VS Code Dark+) */
--terminal-bg: #1e1e1e;
--terminal-fg: #d4d4d4;
--terminal-cursor: #ffffff;

/* ANSI 颜色 */
--terminal-black: #000000;
--terminal-red: #cd3131;
--terminal-green: #0dbc79;
--terminal-yellow: #e5e510;
--terminal-blue: #2472c8;
--terminal-magenta: #bc3fbc;
--terminal-cyan: #11a8cd;
--terminal-white: #e5e5e5;
```

## 页面布局

### 1. 登录页面

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│         ┌─────────────────────────────┐        │
│         │  Docker Lab Platform        │        │
│         │                             │        │
│         │  ┌────────┬────────┐       │        │
│         │  │ 登录   │ 注册   │       │        │
│         │  └────────┴────────┘       │        │
│         │                             │        │
│         │  用户名: [____________]     │        │
│         │  密码:   [____________]     │        │
│         │                             │        │
│         │  [      登录按钮      ]     │        │
│         │                             │        │
│         └─────────────────────────────┘        │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**尺寸规格**:
- 卡片宽度: 400px
- 卡片内边距: 32px
- 输入框高度: 40px
- 按钮高度: 48px
- 圆角: 12px

**交互效果**:
- Tab 切换: 平滑过渡 200ms
- 输入框聚焦: 蓝色边框 + 阴影
- 按钮 hover: 背景色加深
- 错误提示: 红色背景淡入

### 2. 实验页面

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Lab Platform              [启动容器] [停止容器]     │ Header (56px)
├──────────────────────┬──────────────────────────────────────┤
│                      │  ┌─────────┬─────────┐              │
│  # 实验标题          │  │Terminal │  VNC    │              │ Tab Bar (48px)
│                      │  └─────────┴─────────┘              │
│  ## 任务 1           │  ┌────────────────────────────────┐ │
│                      │  │                                │ │
│  1. 创建目录         │  │  $ pwd                         │ │
│  2. 创建文件         │  │  /home/labuser                 │ │
│                      │  │  $ ls -la                      │ │
│  ```bash             │  │  total 20                      │ │
│  mkdir workspace     │  │  drwxr-xr-x  2 labuser         │ │
│  ```                 │  │  $ _                           │ │
│                      │  │                                │ │
│  ## 任务 2           │  │                                │ │
│                      │  │                                │ │
│  ...                 │  │                                │ │
│                      │  └────────────────────────────────┘ │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
   50% 宽度                        50% 宽度
```

**尺寸规格**:
- Header 高度: 56px
- Tab 栏高度: 48px
- 左右分屏: 各 50%
- 最小宽度: 1280px

**响应式断点**:
```css
/* 大屏 */
@media (min-width: 1920px) {
  /* 保持 50/50 分屏 */
}

/* 中屏 */
@media (min-width: 1280px) and (max-width: 1919px) {
  /* 保持 50/50 分屏 */
}

/* 小屏 */
@media (max-width: 1279px) {
  /* 上下布局 */
  /* 题目区: 40% 高度 */
  /* 终端区: 60% 高度 */
}
```

## 组件设计

### 1. 按钮组件

#### 主要按钮 (Primary)
```css
background: #0ea5e9;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;

hover: background: #0284c7;
active: background: #0369a1;
disabled: opacity: 0.5;
```

#### 危险按钮 (Danger)
```css
background: #ef4444;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;

hover: background: #dc2626;
active: background: #b91c1c;
```

#### 次要按钮 (Secondary)
```css
background: #374151;
color: #d4d4d4;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;

hover: background: #4b5563;
active: background: #6b7280;
```

### 2. 输入框组件

```css
background: #2d2d2d;
border: 1px solid #3e3e3e;
color: #d4d4d4;
padding: 10px 16px;
border-radius: 8px;
font-size: 14px;

focus: {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

placeholder: {
  color: #6b7280;
}
```

### 3. Tab 组件

```css
/* 未激活 */
background: transparent;
color: #9ca3af;
padding: 12px 24px;
border-bottom: 2px solid transparent;

hover: {
  color: #d4d4d4;
}

/* 激活 */
background: #1e1e1e;
color: #ffffff;
border-bottom: 2px solid #0ea5e9;
```

### 4. 卡片组件

```css
background: #1e1e1e;
border: 1px solid #3e3e3e;
border-radius: 12px;
padding: 24px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
```

## 动画效果

### 1. 页面切换

```css
transition: opacity 300ms ease-in-out;

/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2. 按钮交互

```css
transition: all 150ms ease-in-out;

hover: {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

active: {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### 3. 加载状态

```css
/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 图标系统

### 使用 Lucide React

```typescript
import { 
  Play,           // 启动
  Square,         // 停止
  Terminal,       // 终端
  Monitor,        // VNC
  User,           // 用户
  LogOut,         // 登出
  Settings,       // 设置
  AlertCircle,    // 警告
  CheckCircle,    // 成功
  XCircle,        // 错误
} from 'lucide-react';
```

**图标规格**:
- 默认大小: 20px
- 按钮图标: 16px
- 标题图标: 24px
- 颜色: 继承父元素

## 字体系统

### 字体栈

```css
/* 系统字体 */
font-family: -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Helvetica Neue', 
             Arial, sans-serif;

/* 等宽字体 (代码/终端) */
font-family: 'Menlo', 'Monaco', 'Courier New', 
             monospace;
```

### 字体大小

```css
--text-xs: 12px;      /* 辅助文字 */
--text-sm: 14px;      /* 正文 */
--text-base: 16px;    /* 基础 */
--text-lg: 18px;      /* 小标题 */
--text-xl: 20px;      /* 标题 */
--text-2xl: 24px;     /* 大标题 */
--text-3xl: 30px;     /* 页面标题 */
```

### 字重

```css
--font-normal: 400;   /* 正文 */
--font-medium: 500;   /* 强调 */
--font-semibold: 600; /* 小标题 */
--font-bold: 700;     /* 标题 */
```

## 间距系统

### Tailwind 间距

```css
0:    0px
1:    4px
2:    8px
3:    12px
4:    16px
5:    20px
6:    24px
8:    32px
10:   40px
12:   48px
16:   64px
20:   80px
24:   96px
```

### 组件间距

```css
/* 卡片内边距 */
padding: 24px;

/* 表单元素间距 */
margin-bottom: 16px;

/* 按钮组间距 */
gap: 12px;

/* 区块间距 */
margin-bottom: 32px;
```

## 阴影系统

```css
/* 小阴影 */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

/* 中阴影 */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* 大阴影 */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);

/* 超大阴影 */
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);

/* 聚焦阴影 */
box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
```

## 状态设计

### 1. 加载状态

```
┌─────────────────────────┐
│                         │
│    ⟳  启动中...         │
│                         │
└─────────────────────────┘
```

### 2. 空状态

```
┌─────────────────────────┐
│                         │
│         ▶               │
│   点击"启动容器"开始实验  │
│                         │
└─────────────────────────┘
```

### 3. 错误状态

```
┌─────────────────────────┐
│                         │
│    ⚠  容器创建失败       │
│    请检查后端服务        │
│                         │
└─────────────────────────┘
```

### 4. 成功状态

```
┌─────────────────────────┐
│                         │
│    ✓  容器启动成功       │
│                         │
└─────────────────────────┘
```

## 终端样式

### xterm.js 主题配置

```typescript
{
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    cursorAccent: '#000000',
    selection: 'rgba(255, 255, 255, 0.3)',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5',
  },
  rows: 30,
  cols: 100,
}
```

## Markdown 样式

### 题目内容渲染

```css
/* 标题 */
h1 { 
  font-size: 24px; 
  font-weight: 700; 
  margin: 24px 0 16px;
  color: #ffffff;
}

h2 { 
  font-size: 20px; 
  font-weight: 600; 
  margin: 20px 0 12px;
  color: #e5e5e5;
}

h3 { 
  font-size: 18px; 
  font-weight: 600; 
  margin: 16px 0 8px;
  color: #d4d4d4;
}

/* 段落 */
p { 
  margin-bottom: 16px; 
  line-height: 1.6;
  color: #d4d4d4;
}

/* 代码块 */
pre {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #3e3e3e;
}

code {
  background: #2d2d2d;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #0dbc79;
  font-family: 'Menlo', monospace;
}

/* 列表 */
ul, ol {
  margin: 16px 0;
  padding-left: 24px;
  color: #d4d4d4;
}

li {
  margin: 8px 0;
  line-height: 1.6;
}

/* 引用 */
blockquote {
  border-left: 4px solid #0ea5e9;
  padding-left: 16px;
  margin: 16px 0;
  color: #9ca3af;
  font-style: italic;
}
```

## 可访问性

### 1. 键盘导航

```
Tab:        焦点切换
Enter:      确认操作
Escape:     取消/关闭
Space:      选择
Arrow Keys: 导航
```

### 2. 焦点样式

```css
:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
```

### 3. ARIA 标签

```html
<button aria-label="启动容器">
  <Play />
</button>

<input 
  type="text" 
  aria-label="用户名"
  aria-required="true"
/>
```

## 性能优化

### 1. CSS 优化

```css
/* 使用 transform 而非 position */
transform: translateY(-1px);

/* 使用 will-change 提示浏览器 */
will-change: transform;

/* 避免重排 */
transform: scale(1.05);
```

### 2. 图片优化

```html
<!-- 使用 WebP 格式 -->
<img src="image.webp" alt="..." />

<!-- 懒加载 -->
<img loading="lazy" src="..." />
```

## 设计资源

### 参考设计

- VS Code: 整体风格
- GitHub: 深色主题
- Vercel: 现代感
- Linear: 动画效果

### 设计工具

- Figma: UI 设计
- Tailwind CSS: 样式框架
- Lucide: 图标库
- Google Fonts: 字体

---

**设计版本**: v1.0.0

**最后更新**: 2024-01-01

**设计师**: AI Assistant
