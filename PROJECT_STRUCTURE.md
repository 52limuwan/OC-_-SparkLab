# 项目结构说明

## 📁 完整目录树

```
docker-lab-platform/
├── README.md                    # 项目说明
├── ARCHITECTURE.md              # 架构设计文档
├── API.md                       # API 接口文档
├── DEPLOYMENT.md                # 部署指南
├── FEATURES.md                  # 功能特性与扩展
├── QUICKSTART.md                # 快速开始指南
├── PROJECT_STRUCTURE.md         # 本文件
├── docker-compose.yml           # Docker Compose 配置
├── start-dev.sh                 # 开发环境启动脚本
│
├── backend/                     # 后端项目（NestJS）
│   ├── package.json            # 依赖配置
│   ├── tsconfig.json           # TypeScript 配置
│   ├── nest-cli.json           # NestJS CLI 配置
│   ├── Dockerfile              # 生产环境镜像
│   ├── .env.example            # 环境变量示例
│   │
│   └── src/
│       ├── main.ts             # 应用入口
│       ├── app.module.ts       # 根模块
│       │
│       ├── auth/               # 认证模块
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── entities/
│       │   │   └── user.entity.ts
│       │   ├── dto/
│       │   │   └── auth.dto.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── guards/
│       │       └── jwt-auth.guard.ts
│       │
│       ├── docker/             # Docker 管理模块
│       │   ├── docker.module.ts
│       │   ├── docker.service.ts
│       │   └── docker.controller.ts
│       │
│       ├── terminal/           # 终端模块
│       │   ├── terminal.module.ts
│       │   └── terminal.gateway.ts
│       │
│       └── lab/                # 实验室模块
│           ├── lab.module.ts
│           ├── lab.service.ts
│           ├── lab.controller.ts
│           └── entities/
│               └── lab.entity.ts
│
├── frontend/                    # 前端项目（Next.js）
│   ├── package.json            # 依赖配置
│   ├── tsconfig.json           # TypeScript 配置
│   ├── next.config.js          # Next.js 配置
│   ├── tailwind.config.ts      # Tailwind CSS 配置
│   ├── postcss.config.js       # PostCSS 配置
│   ├── Dockerfile              # 生产环境镜像
│   │
│   └── src/
│       ├── app/                # App Router
│       │   ├── layout.tsx      # 根布局
│       │   ├── page.tsx        # 首页（重定向）
│       │   ├── globals.css     # 全局样式
│       │   ├── login/
│       │   │   └── page.tsx    # 登录页面
│       │   └── lab/
│       │       └── page.tsx    # 实验页面
│       │
│       ├── components/         # 组件
│       │   ├── Terminal.tsx    # 终端组件
│       │   └── LabContent.tsx  # 题目展示组件
│       │
│       ├── lib/                # 工具库
│       │   └── api.ts          # API 封装
│       │
│       └── store/              # 状态管理
│           └── useAuthStore.ts # 认证状态
│
└── docker-images/              # Docker 镜像
    └── ubuntu-lab/
        ├── Dockerfile          # 实训容器镜像
        └── build.sh            # 构建脚本
```

## 📦 核心模块说明

### Backend 模块

#### 1. Auth Module (认证模块)

**职责**: 用户注册、登录、JWT 认证

**文件**:
- `auth.service.ts`: 业务逻辑（注册、登录、密码验证）
- `auth.controller.ts`: HTTP 接口
- `user.entity.ts`: 用户数据模型
- `jwt.strategy.ts`: JWT 验证策略
- `jwt-auth.guard.ts`: 路由守卫

**关键代码**:
```typescript
// 注册用户
async register(registerDto: RegisterDto) {
  const hashedPassword = await bcrypt.hash(registerDto.password, 10);
  const user = this.userRepository.create({
    ...registerDto,
    password: hashedPassword,
  });
  return this.userRepository.save(user);
}
```

#### 2. Docker Module (容器管理模块)

**职责**: Docker 容器的创建、启动、停止、删除

**文件**:
- `docker.service.ts`: 容器管理逻辑
- `docker.controller.ts`: HTTP 接口

**关键代码**:
```typescript
// 创建容器
async createContainer(userId: string) {
  const container = await this.docker.createContainer({
    Image: 'docker-lab-ubuntu:latest',
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      NanoCpus: 1000000000,
    },
  });
  await container.start();
  return { containerId: container.id };
}
```

#### 3. Terminal Module (终端模块)

**职责**: WebSocket 终端通信

**文件**:
- `terminal.gateway.ts`: WebSocket 网关

**关键代码**:
```typescript
// 启动终端会话
@SubscribeMessage('start')
async handleStart(client: Socket, data: { containerId: string }) {
  const exec = await container.exec({
    Cmd: ['/bin/bash'],
    AttachStdin: true,
    AttachStdout: true,
    Tty: true,
  });
  const stream = await exec.start({ hijack: true });
  
  stream.on('data', (chunk) => {
    client.emit('output', chunk.toString());
  });
}
```

#### 4. Lab Module (实验室模块)

**职责**: 实验题目管理

**文件**:
- `lab.service.ts`: 题目业务逻辑
- `lab.controller.ts`: HTTP 接口
- `lab.entity.ts`: 题目数据模型

### Frontend 模块

#### 1. Pages (页面)

**login/page.tsx**: 登录注册页面
- 表单验证
- JWT Token 存储
- 路由跳转

**lab/page.tsx**: 实验主页面
- 左右分屏布局
- 容器管理
- Tab 切换

#### 2. Components (组件)

**Terminal.tsx**: Web 终端组件
- xterm.js 集成
- WebSocket 通信
- 终端大小自适应

**LabContent.tsx**: 题目展示组件
- Markdown 渲染
- 代码高亮
- 深色主题

#### 3. Store (状态管理)

**useAuthStore.ts**: 认证状态
- 用户信息
- Token 管理
- 登录/登出

#### 4. Lib (工具库)

**api.ts**: API 封装
- Axios 实例
- 请求拦截器
- Token 自动注入

## 🔄 数据流

### 用户登录流程

```
1. 用户输入 → LoginPage
2. authAPI.login() → Backend /auth/login
3. Backend 验证 → 返回 JWT Token
4. useAuthStore.setAuth() → localStorage
5. router.push('/lab') → 跳转实验页面
```

### 容器创建流程

```
1. 点击"启动容器" → LabPage
2. dockerAPI.createContainer() → Backend /docker/container/create
3. Backend dockerode.createContainer() → Docker Engine
4. 返回 containerId → Frontend
5. setContainerId() → 更新状态
```

### 终端通信流程

```
1. Terminal 组件挂载
2. io.connect() → WebSocket 连接
3. socket.emit('start', { containerId })
4. Backend 创建 exec 会话
5. 用户输入 → socket.emit('input')
6. Backend 写入 stdin
7. 容器输出 → socket.emit('output')
8. xterm.write() → 渲染输出
```

## 🎨 UI 组件层次

```
App Layout
└── LoginPage (登录页)
    └── Form
        ├── Input (用户名)
        ├── Input (密码)
        └── Button (登录)

App Layout
└── LabPage (实验页)
    ├── Header
    │   ├── Title
    │   └── Button (启动/停止容器)
    └── Main
        ├── LeftPanel (题目区)
        │   └── LabContent
        │       └── Markdown
        └── RightPanel (实验区)
            ├── Tabs
            │   ├── Terminal Tab
            │   └── VNC Tab
            └── Content
                ├── Terminal (xterm.js)
                └── VNC (待实现)
```

## 🔧 配置文件说明

### backend/tsconfig.json
- TypeScript 编译配置
- 装饰器支持
- 路径别名

### frontend/tsconfig.json
- Next.js TypeScript 配置
- 路径别名 `@/*`

### frontend/tailwind.config.ts
- Tailwind CSS 配置
- 深色主题变量
- 自定义颜色

### docker-compose.yml
- 多容器编排
- 网络配置
- 卷挂载

## 📊 数据库表结构

### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  container_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### labs 表
```sql
CREATE TABLE labs (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'beginner',
  time_limit INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 启动顺序

### 开发环境

1. PostgreSQL (端口 5432)
2. Backend (端口 4000)
3. Frontend (端口 3000)
4. 用户容器 (动态端口)

### 生产环境

```bash
docker-compose up -d
```

所有服务同时启动，依赖关系自动处理。

## 📝 代码规范

### 命名规范

- 文件名: kebab-case (`auth.service.ts`)
- 类名: PascalCase (`AuthService`)
- 变量/函数: camelCase (`createContainer`)
- 常量: UPPER_SNAKE_CASE (`JWT_SECRET`)

### 目录规范

- 模块目录: 小写 (`auth/`, `docker/`)
- 组件目录: PascalCase (`Terminal/`)
- 工具目录: 小写 (`lib/`, `utils/`)

### 导入顺序

```typescript
// 1. 外部依赖
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// 2. 内部模块
import { User } from './entities/user.entity';
import { AuthDto } from './dto/auth.dto';

// 3. 类型定义
import type { JwtPayload } from './types';
```

## 🧪 测试结构（待实现）

```
backend/
└── src/
    └── auth/
        ├── auth.service.ts
        ├── auth.service.spec.ts      # 单元测试
        ├── auth.controller.ts
        └── auth.controller.spec.ts   # 单元测试

test/
├── e2e/
│   ├── auth.e2e-spec.ts             # E2E 测试
│   └── docker.e2e-spec.ts
└── fixtures/
    └── test-data.ts
```

## 📚 扩展阅读

- [NestJS 模块化设计](https://docs.nestjs.com/modules)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Docker API 文档](https://docs.docker.com/engine/api/)
- [xterm.js 使用指南](https://xtermjs.org/docs/)
