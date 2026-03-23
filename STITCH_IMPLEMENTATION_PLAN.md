# 🎨 Stitch 设计实现计划

## 📋 设计页面总览

根据 stitch 文件夹中的设计，我们需要实现以下 7 个页面：

### 1. **Landing Page** (首页)
- ✅ 已有设计
- 功能：产品展示、特性介绍、CTA
- 特点：Hero section、Bento grid、统计数据、架构展示

### 2. **Login/Sign Up** (登录/注册)
- ✅ 已有设计  
- 功能：用户认证、OAuth 登录
- 特点：Glass morphism、深色主题、社交登录

### 3. **Lab Workspace Interactive Terminal** (实验工作区)
- ✅ 已有设计
- 功能：左侧题目、右侧终端、进度跟踪
- 特点：分屏布局、实时终端、Tab 切换

### 4. **Lab Details** (实验详情)
- ✅ 已有设计
- 功能：实验介绍、学习目标、课程大纲
- 特点：侧边栏导航、资源限制展示、进度追踪

### 5. **Admin Container Management** (管理员容器管理)
- ✅ 已有设计
- 功能：容器列表、资源监控、操作管理
- 特点：数据表格、实时状态、批量操作

### 6. **User Profile & Activity** (用户资料)
- ✅ 已有设计
- 功能：用户信息、技能树、活动历史
- 特点：经验系统、徽章展示、API 密钥管理

### 7. **Indigo Terminal** (终端设计系统)
- ✅ 已有设计文档
- 功能：设计规范、组件库
- 特点：Tonal Architecture、无边框设计

## 🎯 设计系统核心特点

### 配色方案
```css
/* 主色调 */
--primary: #a3a6ff;           /* 蓝紫色 */
--secondary: #69f6b8;         /* 翠绿色 */
--tertiary: #ffb148;          /* 橙黄色 */
--error: #ff6e84;             /* 红色 */

/* 表面层次 */
--background: #070d1f;        /* 深色背景 */
--surface: #070d1f;
--surface-container-low: #0c1326;
--surface-container: #11192e;
--surface-container-high: #171f36;
--surface-container-highest: #1c253e;

/* 文字 */
--on-surface: #dfe4fe;
--on-surface-variant: #a5aac2;
```

### 设计原则
1. **Tonal Architecture**: 使用色调层次而非边框
2. **No-Line Rule**: 避免 1px 实线边框
3. **Glass Morphism**: 浮动元素使用毛玻璃效果
4. **Monospace**: 数据密集区域使用 JetBrains Mono

### 字体系统
- **标题**: Inter (700/600)
- **正文**: Inter (400/500)
- **代码**: JetBrains Mono (400/500)

## 🚀 实现优先级

### Phase 1: 核心功能 (已完成)
- [x] 后端基础架构
- [x] 用户认证系统
- [x] 容器管理（模拟）
- [x] WebSocket 终端

### Phase 2: UI 重构 (当前任务)
根据 Stitch 设计重新实现所有页面：

#### 2.1 登录/注册页面
- [ ] 实现 Glass morphism 效果
- [ ] 添加 OAuth 按钮（GitHub/GitLab）
- [ ] 背景网格图案
- [ ] 系统状态栏

#### 2.2 首页 (Landing Page)
- [ ] Hero section 带动画终端
- [ ] Bento grid 特性展示
- [ ] 统计数据展示
- [ ] 架构可视化
- [ ] CTA 按钮

#### 2.3 实验工作区
- [ ] 左右分屏布局 (50/50)
- [ ] 左侧：Markdown 题目渲染
- [ ] 右侧：Terminal + VNC Tab
- [ ] 进度条和提交按钮
- [ ] 资源监控状态栏

#### 2.4 实验详情页
- [ ] 侧边栏导航
- [ ] 实验信息卡片
- [ ] 学习目标网格
- [ ] 课程大纲列表
- [ ] 资源限制展示

#### 2.5 管理员页面
- [ ] 容器列表表格
- [ ] 实时资源监控
- [ ] 操作按钮组
- [ ] 全局日志终端
- [ ] 统计卡片

#### 2.6 用户资料页
- [ ] 用户信息展示
- [ ] 经验进度条
- [ ] 技能树可视化
- [ ] 活动历史列表
- [ ] 徽章展示
- [ ] API 密钥管理

### Phase 3: 增强功能
- [ ] VNC 远程桌面
- [ ] 实验自动判题
- [ ] 实时协作
- [ ] AI 助手

## 📐 组件库规划

### 共享组件

#### 1. TopNavBar (顶部导航)
```tsx
- Logo
- 导航链接 (Explore, Docs, Status)
- 搜索框
- 图标按钮 (Terminal, Notifications, Settings)
- Deploy Lab 按钮
- 用户头像
```

#### 2. SideNavBar (侧边栏)
```tsx
- 项目信息
- 导航菜单
- New Instance 按钮
- Support/Logs 链接
```

#### 3. StatusBar (状态栏)
```tsx
- 系统状态
- 区域信息
- 资源使用
- 版本信息
```

#### 4. Terminal (终端组件)
```tsx
- xterm.js 集成
- WebSocket 连接
- 自适应大小
- 命令历史
```

#### 5. LabContent (题目展示)
```tsx
- Markdown 渲染
- 代码高亮
- 进度追踪
- 任务列表
```

## 🎨 样式实现策略

### 1. 使用 Tailwind CSS
- 自定义配色方案
- 扩展字体系统
- 自定义圆角
- 响应式断点

### 2. 组件样式
```tsx
// Glass morphism
className="bg-surface-container-highest/80 backdrop-blur-xl"

// Tonal gradient
className="bg-gradient-to-b from-primary to-primary-dim"

// No-line separation
className="bg-surface-container-low" // 使用背景色分隔

// Status indicator
className="w-2 h-2 rounded-full bg-secondary animate-pulse"
```

### 3. 动画效果
```tsx
// Hover scale
className="hover:scale-105 transition-transform"

// Active press
className="active:scale-95 transition-all"

// Fade in
className="animate-fade-in"
```

## 📱 响应式设计

### 断点
- **sm**: 640px (手机横屏)
- **md**: 768px (平板)
- **lg**: 1024px (笔记本)
- **xl**: 1280px (桌面)
- **2xl**: 1536px (大屏)

### 布局策略
- 移动端：单列布局，隐藏侧边栏
- 平板：两列布局，可折叠侧边栏
- 桌面：完整布局，固定侧边栏

## 🔧 技术栈

### 前端
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- xterm.js
- Socket.IO Client
- React Markdown
- Lucide React (图标)

### 后端
- NestJS
- TypeORM
- SQLite (sql.js)
- bcryptjs
- Socket.IO
- JWT

## 📝 实现步骤

### Step 1: 设置 Tailwind 配置
```bash
# 更新 tailwind.config.ts
# 添加自定义颜色、字体、圆角
```

### Step 2: 创建共享组件
```bash
# components/TopNavBar.tsx
# components/SideNavBar.tsx
# components/StatusBar.tsx
# components/Terminal.tsx
# components/LabContent.tsx
```

### Step 3: 实现页面
```bash
# app/page.tsx (Landing)
# app/login/page.tsx
# app/lab/page.tsx (Workspace)
# app/lab/[id]/page.tsx (Details)
# app/admin/containers/page.tsx
# app/profile/page.tsx
```

### Step 4: 样式优化
```bash
# 添加动画
# 优化响应式
# 测试深色主题
```

### Step 5: 集成后端
```bash
# API 连接
# WebSocket 集成
# 状态管理
```

## 🎯 成功标准

- [ ] 所有页面符合 Stitch 设计
- [ ] 深色主题完美实现
- [ ] 响应式布局正常
- [ ] 动画流畅自然
- [ ] 终端实时交互
- [ ] 性能优化完成

## 📚 参考资源

- Stitch 设计文件: `stitch/` 文件夹
- 设计系统文档: `stitch/indigo_terminal/DESIGN.md`
- Material Symbols: https://fonts.google.com/icons
- Tailwind CSS: https://tailwindcss.com/docs

---

**准备开始实现！** 🚀

让我们从登录页面开始，逐步实现所有设计。
