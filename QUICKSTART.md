# 快速开始指南

## 🎯 5 分钟快速体验

### 前置条件

确保已安装：
- ✅ Node.js 20+
- ✅ Docker Desktop
- ✅ PostgreSQL 15+

### 步骤 1: 克隆项目

```bash
git clone <repository-url>
cd docker-lab-platform
```

### 步骤 2: 构建实训镜像

```bash
cd docker-images/ubuntu-lab
chmod +x build.sh
./build.sh
cd ../..
```

### 步骤 3: 启动数据库

```bash
docker run -d \
  --name docker-lab-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=docker_lab \
  -p 5432:5432 \
  postgres:15
```

### 步骤 4: 启动后端

```bash
cd backend
npm install
npm run start:dev
```

等待看到：
```
🚀 Backend running on http://localhost:4000
```

### 步骤 5: 启动前端（新终端）

```bash
cd frontend
npm install
npm run dev
```

等待看到：
```
✓ Ready on http://localhost:3000
```

### 步骤 6: 访问应用

打开浏览器访问: http://localhost:3000

1. 点击"注册"创建账号
2. 登录后进入实验页面
3. 点击"启动容器"
4. 在终端中输入命令开始实验！

## 🎮 使用示例

### 注册账号

```
用户名: testuser
邮箱: test@example.com
密码: password123
```

### 开始第一个实验

启动容器后，在终端中尝试：

```bash
# 查看当前目录
pwd

# 创建工作目录
mkdir workspace
cd workspace

# 创建文件
echo "Hello Docker Lab!" > hello.txt

# 查看文件内容
cat hello.txt

# 查看系统信息
uname -a
whoami

# 安装软件（需要 sudo）
sudo apt-get update
sudo apt-get install -y htop

# 查看系统资源
htop
```

## 🐛 常见问题

### 问题 1: 容器创建失败

**错误**: `Cannot connect to Docker daemon`

**解决**:
```bash
# 启动 Docker 服务
sudo systemctl start docker

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 问题 2: 数据库连接失败

**错误**: `Connection refused`

**解决**:
```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 重启数据库
docker restart docker-lab-db

# 检查端口占用
lsof -i :5432
```

### 问题 3: 前端无法连接后端

**错误**: `Network Error`

**解决**:
1. 确保后端已启动（http://localhost:4000）
2. 检查 CORS 配置
3. 清除浏览器缓存

### 问题 4: WebSocket 连接失败

**错误**: `WebSocket connection failed`

**解决**:
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 4000

# 检查后端日志
# 查看是否有 WebSocket 连接日志
```

### 问题 5: 镜像构建失败

**错误**: `Cannot build image`

**解决**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
cd docker-images/ubuntu-lab
docker build -t docker-lab-ubuntu:latest .
```

## 📝 开发技巧

### 热重载

后端和前端都支持热重载，修改代码后自动刷新。

### 调试后端

```bash
# 使用 VS Code 调试
# 在 .vscode/launch.json 中添加：
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229
}

# 启动调试模式
npm run start:debug
```

### 查看日志

```bash
# 后端日志
cd backend
npm run start:dev

# 容器日志
docker logs -f <container-id>

# 数据库日志
docker logs -f docker-lab-db
```

### 数据库管理

```bash
# 连接数据库
docker exec -it docker-lab-db psql -U postgres -d docker_lab

# 查看表
\dt

# 查看用户
SELECT * FROM users;

# 退出
\q
```

## 🧪 测试功能

### 测试 API

```bash
# 注册用户
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 登录
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 保存返回的 token
TOKEN="<your-token>"

# 创建容器
curl -X POST http://localhost:4000/docker/container/create \
  -H "Authorization: Bearer $TOKEN"
```

### 测试 WebSocket

使用浏览器控制台：

```javascript
const socket = io('http://localhost:4000/terminal');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('start', { containerId: '<your-container-id>' });
});

socket.on('output', (data) => {
  console.log('Output:', data);
});

socket.emit('input', 'echo "Hello"\n');
```

## 🚀 下一步

1. 阅读 [架构文档](./ARCHITECTURE.md) 了解系统设计
2. 查看 [API 文档](./API.md) 学习接口使用
3. 参考 [功能特性](./FEATURES.md) 了解扩展方向
4. 阅读 [部署指南](./DEPLOYMENT.md) 准备生产环境

## 💡 学习资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Next.js 官方文档](https://nextjs.org/docs)
- [Docker 官方文档](https://docs.docker.com/)
- [xterm.js 文档](https://xtermjs.org/)
- [Socket.IO 文档](https://socket.io/docs/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License
