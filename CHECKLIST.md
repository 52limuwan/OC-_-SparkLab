# 项目启动检查清单

## 📋 开发环境准备

### 1. 系统要求

- [ ] 操作系统: Linux / macOS / Windows (WSL2)
- [ ] Node.js: 20.x 或更高版本
- [ ] Docker: 20.x 或更高版本
- [ ] PostgreSQL: 15.x 或更高版本
- [ ] Git: 2.x 或更高版本

### 2. 验证安装

```bash
# 检查 Node.js
node --version  # 应该 >= 20.0.0

# 检查 npm
npm --version   # 应该 >= 10.0.0

# 检查 Docker
docker --version  # 应该 >= 20.0.0
docker ps        # 应该能正常运行

# 检查 PostgreSQL
psql --version   # 应该 >= 15.0
```

## 🚀 项目启动步骤

### 步骤 1: 克隆项目

- [ ] 克隆代码仓库
- [ ] 进入项目目录

```bash
git clone <repository-url>
cd docker-lab-platform
```

### 步骤 2: 构建 Docker 镜像

- [ ] 进入镜像目录
- [ ] 执行构建脚本
- [ ] 验证镜像创建成功

```bash
cd docker-images/ubuntu-lab
chmod +x build.sh
./build.sh
docker images | grep docker-lab-ubuntu
cd ../..
```

### 步骤 3: 启动数据库

- [ ] 启动 PostgreSQL 容器
- [ ] 等待数据库就绪
- [ ] 验证数据库连接

```bash
docker run -d \
  --name docker-lab-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=docker_lab \
  -p 5432:5432 \
  postgres:15

# 等待 5 秒
sleep 5

# 验证连接
docker exec -it docker-lab-db psql -U postgres -d docker_lab -c "SELECT 1;"
```

### 步骤 4: 配置后端

- [ ] 进入后端目录
- [ ] 安装依赖
- [ ] 配置环境变量
- [ ] 启动后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量（可选）
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
npm run start:dev
```

等待看到：
```
🚀 Backend running on http://localhost:4000
```

### 步骤 5: 配置前端

- [ ] 打开新终端
- [ ] 进入前端目录
- [ ] 安装依赖
- [ ] 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

等待看到：
```
✓ Ready on http://localhost:3000
```

### 步骤 6: 验证功能

- [ ] 访问 http://localhost:3000
- [ ] 注册新用户
- [ ] 登录系统
- [ ] 启动容器
- [ ] 测试终端

## ✅ 功能测试清单

### 用户系统

- [ ] 用户注册
  - [ ] 输入用户名、邮箱、密码
  - [ ] 提交表单
  - [ ] 看到成功提示

- [ ] 用户登录
  - [ ] 输入用户名、密码
  - [ ] 提交表单
  - [ ] 跳转到实验页面

- [ ] Token 验证
  - [ ] 刷新页面保持登录状态
  - [ ] 未登录访问 /lab 自动跳转登录

### 容器管理

- [ ] 创建容器
  - [ ] 点击"启动容器"按钮
  - [ ] 等待 2-3 秒
  - [ ] 看到容器 ID

- [ ] 容器状态
  - [ ] 容器创建后按钮变为"停止容器"
  - [ ] 终端区域显示终端界面

- [ ] 停止容器
  - [ ] 点击"停止容器"按钮
  - [ ] 容器停止
  - [ ] 按钮变回"启动容器"

### Web Terminal

- [ ] 终端连接
  - [ ] 容器启动后自动连接
  - [ ] 看到 "Terminal ready" 提示

- [ ] 命令执行
  - [ ] 输入 `pwd` 并回车
  - [ ] 看到当前目录输出
  - [ ] 输入 `ls -la` 并回车
  - [ ] 看到文件列表

- [ ] 交互式命令
  - [ ] 输入 `python3` 进入 Python
  - [ ] 输入 `print("Hello")`
  - [ ] 看到输出
  - [ ] 输入 `exit()` 退出

- [ ] 终端大小
  - [ ] 调整浏览器窗口大小
  - [ ] 终端自动适应

### 题目展示

- [ ] Markdown 渲染
  - [ ] 标题正确显示
  - [ ] 代码块高亮
  - [ ] 列表格式正确

- [ ] 滚动功能
  - [ ] 题目区域可以滚动
  - [ ] 滚动条样式正常

### UI/UX

- [ ] 深色主题
  - [ ] 背景色为深色
  - [ ] 文字清晰可读
  - [ ] 对比度合适

- [ ] 响应式布局
  - [ ] 左右分屏正常
  - [ ] Tab 切换流畅
  - [ ] 按钮 hover 效果

- [ ] 动画效果
  - [ ] 页面切换平滑
  - [ ] 按钮点击反馈
  - [ ] 加载状态显示

## 🐛 常见问题排查

### 问题 1: 后端启动失败

检查项：
- [ ] PostgreSQL 是否运行
- [ ] 端口 4000 是否被占用
- [ ] 依赖是否安装完整
- [ ] 环境变量是否配置

```bash
# 检查 PostgreSQL
docker ps | grep postgres

# 检查端口
lsof -i :4000

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: 前端启动失败

检查项：
- [ ] 端口 3000 是否被占用
- [ ] 依赖是否安装完整
- [ ] Node.js 版本是否正确

```bash
# 检查端口
lsof -i :3000

# 检查 Node.js 版本
node --version

# 重新安装依赖
rm -rf node_modules package-lock.json .next
npm install
```

### 问题 3: 容器创建失败

检查项：
- [ ] Docker 服务是否运行
- [ ] Docker 镜像是否构建
- [ ] Docker socket 权限
- [ ] 后端日志错误信息

```bash
# 检查 Docker 服务
sudo systemctl status docker

# 检查镜像
docker images | grep docker-lab-ubuntu

# 检查权限
ls -l /var/run/docker.sock

# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 问题 4: 终端连接失败

检查项：
- [ ] WebSocket 连接是否成功
- [ ] 容器是否正在运行
- [ ] 浏览器控制台错误
- [ ] 后端 WebSocket 日志

```bash
# 检查容器状态
docker ps

# 查看后端日志
# 应该看到 WebSocket 连接日志

# 检查浏览器控制台
# F12 打开开发者工具
# 查看 Network -> WS 标签
```

### 问题 5: 数据库连接失败

检查项：
- [ ] PostgreSQL 容器是否运行
- [ ] 端口 5432 是否可访问
- [ ] 数据库凭据是否正确
- [ ] 网络连接是否正常

```bash
# 测试连接
docker exec -it docker-lab-db psql -U postgres -d docker_lab

# 查看容器日志
docker logs docker-lab-db

# 重启容器
docker restart docker-lab-db
```

## 📊 性能检查

### 后端性能

- [ ] 登录接口响应时间 < 200ms
- [ ] 容器创建时间 < 3s
- [ ] API 响应时间 < 100ms
- [ ] 内存占用 < 200MB

### 前端性能

- [ ] 首屏加载时间 < 2s
- [ ] 页面切换时间 < 500ms
- [ ] 终端响应延迟 < 50ms
- [ ] 打包大小 < 3MB

### 容器性能

- [ ] 容器启动时间 < 2s
- [ ] 内存占用 < 512MB
- [ ] CPU 使用率 < 50%
- [ ] 终端响应流畅

## 🔒 安全检查

- [ ] JWT Secret 已修改
- [ ] 数据库密码已修改
- [ ] CORS 配置正确
- [ ] 容器以非 root 运行
- [ ] 资源限制已配置
- [ ] 敏感信息不在代码中

## 📝 文档检查

- [ ] README.md 完整
- [ ] API.md 准确
- [ ] DEPLOYMENT.md 可用
- [ ] 代码注释清晰
- [ ] 环境变量说明完整

## 🎉 完成确认

全部检查通过后，你应该能够：

- ✅ 成功注册和登录
- ✅ 创建和管理容器
- ✅ 在终端中执行命令
- ✅ 查看实验题目
- ✅ 流畅使用界面

恭喜！你的 Docker Lab Platform 已经成功运行！🚀

## 📞 获取帮助

如果遇到问题：

1. 查看项目文档
2. 检查日志输出
3. 搜索相关错误
4. 提交 Issue
5. 参与讨论

---

**祝你使用愉快！** 🎓
