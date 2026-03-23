# 📁 完整文件树

```
docker-lab-platform/                    # 项目根目录
│
├── 📄 README.md                        # 项目说明文档
├── 📄 ARCHITECTURE.md                  # 架构设计文档 (3000+ 字)
├── 📄 API.md                           # API 接口文档 (完整)
├── 📄 DEPLOYMENT.md                    # 部署指南 (详细)
├── 📄 FEATURES.md                      # 功能特性与扩展方向
├── 📄 QUICKSTART.md                    # 5分钟快速开始指南
├── 📄 PROJECT_STRUCTURE.md             # 项目结构详细说明
├── 📄 SUMMARY.md                       # 项目总结
├── 📄 CHECKLIST.md                     # 启动检查清单
├── 📄 OVERVIEW.md                      # 项目完整概览
├── 📄 FILE_TREE.md                     # 本文件
├── 📄 .gitignore                       # Git 忽略配置
├── 📄 docker-compose.yml               # Docker Compose 编排
├── 📄 start-dev.sh                     # 开发环境启动脚本
│
├── 📁 backend/                         # 后端项目 (NestJS)
│   ├── 📄 package.json                 # 依赖配置
│   ├── 📄 tsconfig.json                # TypeScript 配置
│   ├── 📄 nest-cli.json                # NestJS CLI 配置
│   ├── 📄 Dockerfile                   # 生产环境镜像
│   ├── 📄 .env.example                 # 环境变量示例
│   │
│   └── 📁 src/                         # 源代码目录
│       ├── 📄 main.ts                  # 应用入口文件
│       ├── 📄 app.module.ts            # 根模块
│       │
│       ├── 📁 auth/                    # 认证模块
│       │   ├── 📄 auth.module.ts       # 模块定义
│       │   ├── 📄 auth.service.ts      # 业务逻辑
│       │   ├── 📄 auth.controller.ts   # HTTP 控制器
│       │   │
│       │   ├── 📁 entities/            # 数据模型
│       │   │   └── 📄 user.entity.ts   # 用户实体
│       │   │
│       │   ├── 📁 dto/                 # 数据传输对象
│       │   │   └── 📄 auth.dto.ts      # 认证 DTO
│       │   │
│       │   ├── 📁 strategies/          # 认证策略
│       │   │   └── 📄 jwt.strategy.ts  # JWT 策略
│       │   │
│       │   └── 📁 guards/              # 路由守卫
│       │       └── 📄 jwt-auth.guard.ts # JWT 守卫
│       │
│       ├── 📁 docker/                  # Docker 管理模块
│       │   ├── 📄 docker.module.ts     # 模块定义
│       │   ├── 📄 docker.service.ts    # 容器管理服务
│       │   └── 📄 docker.controller.ts # HTTP 控制器
│       │
│       ├── 📁 terminal/                # 终端模块
│       │   ├── 📄 terminal.module.ts   # 模块定义
│       │   └── 📄 terminal.gateway.ts  # WebSocket 网关
│       │
│       └── 📁 lab/                     # 实验室模块
│           ├── 📄 lab.module.ts        # 模块定义
│           ├── 📄 lab.service.ts       # 业务逻辑
│           ├── 📄 lab.controller.ts    # HTTP 控制器
│           │
│           └── 📁 entities/            # 数据模型
│               └── 📄 lab.entity.ts    # 实验实体
│
├── 📁 frontend/                        # 前端项目 (Next.js)
│   ├── 📄 package.json                 # 依赖配置
│   ├── 📄 tsconfig.json                # TypeScript 配置
│   ├── 📄 next.config.js               # Next.js 配置
│   ├── 📄 tailwind.config.ts           # Tailwind CSS 配置
│   ├── 📄 postcss.config.js            # PostCSS 配置
│   ├── 📄 Dockerfile                   # 生产环境镜像
│   │
│   └── 📁 src/                         # 源代码目录
│       │
│       ├── 📁 app/                     # App Router 目录
│       │   ├── 📄 layout.tsx           # 根布局组件
│       │   ├── 📄 page.tsx             # 首页 (重定向)
│       │   ├── 📄 globals.css          # 全局样式
│       │   │
│       │   ├── 📁 login/               # 登录页面
│       │   │   └── 📄 page.tsx         # 登录/注册页面
│       │   │
│       │   └── 📁 lab/                 # 实验页面
│       │       └── 📄 page.tsx         # 实验主页面
│       │
│       ├── 📁 components/              # 组件目录
│       │   ├── 📄 Terminal.tsx         # Web 终端组件
│       │   └── 📄 LabContent.tsx       # 题目展示组件
│       │
│       ├── 📁 lib/                     # 工具库
│       │   └── 📄 api.ts               # API 封装
│       │
│       └── 📁 store/                   # 状态管理
│           └── 📄 useAuthStore.ts      # 认证状态
│
├── 📁 docker-images/                   # Docker 镜像
│   └── 📁 ubuntu-lab/                  # 实训容器镜像
│       ├── 📄 Dockerfile               # 镜像定义
│       └── 📄 build.sh                 # 构建脚本
│
└── 📁 database/                        # 数据库相关
    └── 📄 seed.sql                     # 示例数据 (5个实验)

```

## 📊 文件统计

### 总体统计
```
总文件数:     55 个
代码文件:     30 个
配置文件:     10 个
文档文件:     11 个
脚本文件:     4 个
```

### 按类型统计

#### TypeScript/TSX 文件 (22 个)
```
后端:
- main.ts
- app.module.ts
- auth.module.ts, auth.service.ts, auth.controller.ts
- user.entity.ts, auth.dto.ts
- jwt.strategy.ts, jwt-auth.guard.ts
- docker.module.ts, docker.service.ts, docker.controller.ts
- terminal.module.ts, terminal.gateway.ts
- lab.module.ts, lab.service.ts, lab.controller.ts, lab.entity.ts

前端:
- layout.tsx, page.tsx (root)
- page.tsx (login), page.tsx (lab)
- Terminal.tsx, LabContent.tsx
- api.ts, useAuthStore.ts
```

#### 配置文件 (10 个)
```
后端:
- package.json, tsconfig.json, nest-cli.json
- Dockerfile, .env.example

前端:
- package.json, tsconfig.json
- next.config.js, tailwind.config.ts, postcss.config.js
- Dockerfile

根目录:
- docker-compose.yml, .gitignore
```

#### 文档文件 (11 个)
```
- README.md                    (项目说明)
- ARCHITECTURE.md              (架构设计)
- API.md                       (接口文档)
- DEPLOYMENT.md                (部署指南)
- FEATURES.md                  (功能特性)
- QUICKSTART.md                (快速开始)
- PROJECT_STRUCTURE.md         (项目结构)
- SUMMARY.md                   (项目总结)
- CHECKLIST.md                 (启动清单)
- OVERVIEW.md                  (项目概览)
- FILE_TREE.md                 (本文件)
```

#### 其他文件 (4 个)
```
- start-dev.sh                 (启动脚本)
- build.sh                     (镜像构建)
- seed.sql                     (示例数据)
- globals.css                  (全局样式)
```

## 📏 代码行数统计

### 后端代码
```
TypeScript:        ~1200 行
├── auth 模块:      ~300 行
├── docker 模块:    ~250 行
├── terminal 模块:  ~150 行
├── lab 模块:       ~200 行
└── 配置文件:       ~300 行
```

### 前端代码
```
TypeScript/TSX:    ~900 行
├── 页面组件:       ~500 行
├── 功能组件:       ~300 行
├── 工具库:         ~100 行
└── 配置文件:       ~200 行

CSS:               ~100 行
```

### 文档
```
Markdown:          ~15000 字
├── 架构文档:       ~3000 字
├── API 文档:       ~2000 字
├── 部署文档:       ~2500 字
├── 功能文档:       ~3000 字
└── 其他文档:       ~4500 字
```

## 🎯 核心文件说明

### 最重要的 10 个文件

1. **backend/src/main.ts**
   - 后端应用入口
   - 配置 CORS、验证管道
   - 启动服务器

2. **backend/src/docker/docker.service.ts**
   - 容器管理核心逻辑
   - dockerode API 封装
   - 资源限制配置

3. **backend/src/terminal/terminal.gateway.ts**
   - WebSocket 终端网关
   - PTY 转发实现
   - 实时通信处理

4. **backend/src/auth/auth.service.ts**
   - 用户认证逻辑
   - JWT Token 生成
   - 密码加密验证

5. **frontend/src/app/lab/page.tsx**
   - 实验主页面
   - 左右分屏布局
   - 容器管理界面

6. **frontend/src/components/Terminal.tsx**
   - Web 终端组件
   - xterm.js 集成
   - WebSocket 通信

7. **frontend/src/lib/api.ts**
   - API 请求封装
   - Token 自动注入
   - 错误处理

8. **docker-images/ubuntu-lab/Dockerfile**
   - 实训容器镜像
   - 环境配置
   - 用户设置

9. **docker-compose.yml**
   - 容器编排配置
   - 服务依赖关系
   - 网络配置

10. **ARCHITECTURE.md**
    - 架构设计文档
    - 系统流程说明
    - 技术决策记录

## 🔍 文件依赖关系

### 后端模块依赖
```
app.module.ts
├── auth.module.ts
│   ├── user.entity.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── jwt.strategy.ts
│
├── docker.module.ts
│   ├── docker.service.ts
│   └── docker.controller.ts
│
├── terminal.module.ts
│   └── terminal.gateway.ts
│
└── lab.module.ts
    ├── lab.entity.ts
    ├── lab.service.ts
    └── lab.controller.ts
```

### 前端组件依赖
```
layout.tsx
└── page.tsx (root)
    ├── login/page.tsx
    │   ├── api.ts
    │   └── useAuthStore.ts
    │
    └── lab/page.tsx
        ├── Terminal.tsx
        │   └── api.ts
        ├── LabContent.tsx
        └── useAuthStore.ts
```

## 📦 打包产物

### 开发环境
```
backend/
├── node_modules/      (~200MB)
└── dist/              (编译后)

frontend/
├── node_modules/      (~300MB)
└── .next/             (编译后)
```

### 生产环境
```
Docker 镜像:
├── backend:latest     (~150MB)
├── frontend:latest    (~120MB)
└── ubuntu-lab:latest  (~200MB)
```

## 🎨 文件命名规范

### 后端
```
模块文件:    *.module.ts
服务文件:    *.service.ts
控制器:      *.controller.ts
网关:        *.gateway.ts
实体:        *.entity.ts
DTO:         *.dto.ts
策略:        *.strategy.ts
守卫:        *.guard.ts
```

### 前端
```
页面:        page.tsx
布局:        layout.tsx
组件:        PascalCase.tsx
工具:        camelCase.ts
样式:        globals.css
配置:        *.config.js/ts
```

## 📚 推荐阅读顺序

### 新手入门
1. README.md
2. QUICKSTART.md
3. CHECKLIST.md
4. 运行项目

### 深入理解
1. ARCHITECTURE.md
2. PROJECT_STRUCTURE.md
3. API.md
4. 阅读核心代码

### 扩展开发
1. FEATURES.md
2. DEPLOYMENT.md
3. 修改代码
4. 添加功能

---

**文件树最后更新**: 2024-01-01

**总文件数**: 55 个

**项目状态**: ✅ 完整交付
