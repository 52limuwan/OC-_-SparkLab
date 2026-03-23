# 本地开发环境启动指南

## 🎯 本地开发模式说明

本地开发模式使用以下配置：
- ✅ SQLite 数据库（无需安装 PostgreSQL）
- ✅ 模拟 Docker 容器（无需 Docker Engine）
- ✅ 本地 Shell 终端（PowerShell/Bash）

## 📋 前置要求

- Node.js 20+ ✅ (已安装 v25.8.1)
- npm 10+ ✅ (已安装 v11.11.0)

## 🚀 启动步骤

### 1. 安装后端依赖

```powershell
cd backend
npm install
```

### 2. 启动后端服务

```powershell
npm run start:dev
```

等待看到：
```
🚀 Backend running on http://localhost:4000
```

### 3. 安装前端依赖（新终端）

```powershell
cd frontend
npm install
```

### 4. 启动前端服务

```powershell
npm run dev
```

等待看到：
```
✓ Ready on http://localhost:3000
```

### 5. 访问应用

打开浏览器访问: http://localhost:3000

## 📝 使用说明

### 注册账号
1. 点击"注册"
2. 输入用户名、邮箱、密码
3. 提交注册

### 登录系统
1. 输入用户名、密码
2. 点击"登录"
3. 自动跳转到实验页面

### 启动终端
1. 点击"启动容器"按钮
2. 等待 1-2 秒
3. 终端自动连接

### 使用终端
- Windows: 使用 PowerShell 命令
- Linux/Mac: 使用 Bash 命令

示例命令：
```powershell
# Windows PowerShell
Get-Location
Get-ChildItem
Write-Output "Hello Docker Lab"

# 或者使用通用命令
node --version
npm --version
```

## 🔧 开发技巧

### 热重载
- 后端：修改代码自动重启
- 前端：修改代码自动刷新

### 查看日志
- 后端日志：在后端终端查看
- 前端日志：浏览器控制台 (F12)

### 数据库文件
- 位置：`backend/docker_lab.db`
- 类型：SQLite
- 工具：可使用 DB Browser for SQLite 查看

### 清空数据
```powershell
# 删除数据库文件重新开始
cd backend
Remove-Item docker_lab.db
npm run start:dev
```

## ⚠️ 注意事项

### 本地模式限制
1. 终端运行在本地系统，不是隔离容器
2. 没有资源限制（CPU/内存）
3. 文件操作会影响本地文件系统
4. 不建议执行危险命令

### 安全提示
- 不要在终端中执行删除系统文件的命令
- 不要运行不信任的脚本
- 终端当前目录是项目根目录

## 🐛 常见问题

### 问题 1: npm 执行策略错误

```powershell
# 临时解决
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 问题 2: 端口被占用

```powershell
# 检查端口占用
netstat -ano | findstr :4000
netstat -ano | findstr :3000

# 结束进程
taskkill /PID <进程ID> /F
```

### 问题 3: 依赖安装失败

```powershell
# 清理缓存重新安装
npm cache clean --force
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### 问题 4: 终端连接失败

- 检查后端是否正常运行
- 查看浏览器控制台错误
- 检查 WebSocket 连接状态

## 📊 开发环境状态

### 后端服务
- 地址: http://localhost:4000
- 数据库: SQLite (docker_lab.db)
- 容器: 模拟模式

### 前端服务
- 地址: http://localhost:3000
- 框架: Next.js 14
- 热重载: 已启用

### 终端服务
- 协议: WebSocket
- 地址: ws://localhost:4000/terminal
- Shell: PowerShell (Windows)

## 🎓 下一步

1. 测试用户注册/登录
2. 体验终端功能
3. 查看实验题目
4. 修改代码测试
5. 准备部署到生产环境

## 💡 提示

- 本地模式适合快速开发和测试
- 生产环境建议使用 Docker 容器
- 完整功能需要 Docker Engine 支持

---

**开发愉快！** 🚀
