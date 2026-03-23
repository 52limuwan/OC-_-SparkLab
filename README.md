# Docker 在线实训平台

## 项目结构

```
docker-lab-platform/
├── frontend/          # Next.js 前端
├── backend/           # NestJS 后端
├── docker-images/     # 实训容器镜像
└── docker-compose.yml # 开发环境编排
```

## 快速启动

### 开发环境

```bash
# 1. 启动后端
cd backend
npm install
npm run start:dev

# 2. 启动前端
cd frontend
npm install
npm run dev
```

### 生产环境

```bash
docker-compose up -d
```

## 技术栈

- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui + xterm.js
- Backend: NestJS + PostgreSQL + Redis + dockerode
- Infrastructure: Docker + Docker Compose

## 功能特性

- ✅ 用户注册/登录 (JWT)
- ✅ 独立 Docker 容器环境
- ✅ Web Terminal (xterm.js)
- ✅ VNC 远程桌面 (noVNC)
- ✅ Markdown 题目渲染
- ✅ 资源限制 (CPU/内存)
- ✅ 多用户并发支持
