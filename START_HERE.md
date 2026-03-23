# 🚀 本地开发环境 - 快速启动

## ✅ 系统检查

你的环境：
- Node.js: v25.8.1 ✅
- npm: 11.11.0 ✅
- 操作系统: Windows ✅

## 📝 启动步骤

### 第一步：安装后端依赖

打开 PowerShell 或 CMD，执行：

```powershell
cd backend
npm install
```

等待安装完成（可能需要 2-5 分钟）

### 第二步：启动后端

```powershell
npm run start:dev
```

看到以下信息表示成功：
```
[Nest] 12345  - 2024/01/01 12:00:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2024/01/01 12:00:00     LOG [InstanceLoader] AppModule dependencies initialized
🚀 Backend running on http://localhost:4000
```

### 第三步：安装前端依赖

打开**新的** PowerShell 窗口，执行：

```powershell
cd frontend
npm install
```

### 第四步：启动前端

```powershell
npm run dev
```

看到以下信息表示成功：
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  
✓ Ready in 2.5s
```

### 第五步：访问应用

打开浏览器，访问：http://localhost:3000

## 🎯 使用流程

### 1. 注册账号
- 点击"注册"标签
- 输入：
  - 用户名：testuser
  - 邮箱：test@example.com
  - 密码：password123
- 点击"注册"按钮

### 2. 登录系统
- 切换到"登录"标签
- 输入用户名和密码
- 点击"登录"按钮
- 自动跳转到实验页面

### 3. 启动终端
- 点击右上角"启动容器"按钮
- 等待 1-2 秒
- 终端自动连接并显示 PowerShell 提示符

### 4. 使用终端
在终端中可以执行 PowerShell 命令：

```powershell
# 查看当前目录
Get-Location

# 列出文件
Get-ChildItem

# 查看 Node.js 版本
node --version

# 输出文本
Write-Output "Hello Docker Lab!"

# 创建文件
New-Item -Path test.txt -ItemType File
```

## ⚠️ 重要提示

### 本地模式说明
- ✅ 使用 SQLite 数据库（自动创建）
- ✅ 终端运行在本地 PowerShell
- ⚠️ 没有容器隔离
- ⚠️ 文件操作会影响本地系统

### 安全建议
- 不要执行删除系统文件的命令
- 不要运行不信任的脚本
- 终端当前目录是项目根目录

## 🐛 常见问题

### 问题 1: npm 命令无法执行

**解决方案**：
```powershell
# 设置执行策略
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 问题 2: 端口被占用

**错误信息**：`Port 4000 is already in use`

**解决方案**：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :4000

# 结束进程（替换 <PID> 为实际进程 ID）
taskkill /PID <PID> /F
```

### 问题 3: 依赖安装失败

**解决方案**：
```powershell
# 清理并重新安装
npm cache clean --force
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

### 问题 4: 后端启动报错

**常见错误**：数据库连接失败

**解决方案**：
- 检查 `backend/docker_lab.db` 文件是否存在
- 如果不存在，会自动创建
- 如果有问题，删除该文件重新启动

### 问题 5: 前端无法连接后端

**解决方案**：
1. 确保后端已启动（http://localhost:4000）
2. 检查浏览器控制台（F12）查看错误
3. 确认防火墙没有阻止连接

## 📊 开发环境信息

### 后端服务
- 地址：http://localhost:4000
- 框架：NestJS
- 数据库：SQLite (backend/docker_lab.db)
- WebSocket：ws://localhost:4000/terminal

### 前端服务
- 地址：http://localhost:3000
- 框架：Next.js 14
- 样式：Tailwind CSS

### 数据存储
- 数据库文件：`backend/docker_lab.db`
- 用户数据：users 表
- 实验数据：labs 表

## 🔧 开发技巧

### 热重载
- 后端：修改 `.ts` 文件自动重启
- 前端：修改 `.tsx` 文件自动刷新

### 查看日志
- 后端日志：在后端终端窗口查看
- 前端日志：浏览器控制台 (F12)
- 网络请求：浏览器 Network 标签

### 停止服务
- 在对应的终端窗口按 `Ctrl + C`

### 重启服务
- 停止服务后重新运行启动命令

## 📚 下一步

1. ✅ 完成用户注册和登录
2. ✅ 测试终端功能
3. ✅ 查看实验题目
4. 📖 阅读 [API.md](./API.md) 了解接口
5. 📖 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构
6. 🔧 开始修改代码进行开发

## 💡 快速命令参考

```powershell
# 后端
cd backend
npm install          # 安装依赖
npm run start:dev    # 启动开发服务器
npm run build        # 构建生产版本

# 前端
cd frontend
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本

# 清理数据库
cd backend
Remove-Item docker_lab.db
```

## 🎓 学习资源

- [NestJS 文档](https://docs.nestjs.com/)
- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**准备好了吗？开始你的开发之旅！** 🚀

有任何问题，请查看文档或提出 Issue。
