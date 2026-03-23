# 部署指南

## 开发环境部署

### 前置要求

- Node.js 20+
- Docker Engine
- PostgreSQL 15+
- Git

### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd docker-lab-platform

# 2. 构建实训镜像
cd docker-images/ubuntu-lab
chmod +x build.sh
./build.sh
cd ../..

# 3. 启动数据库
docker run -d \
  --name docker-lab-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# 4. 启动后端
cd backend
npm install
cp .env.example .env
npm run start:dev

# 5. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

## 生产环境部署

### 使用 Docker Compose

```bash
# 1. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，修改生产配置

# 2. 构建并启动
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 手动部署

#### 1. 数据库

```bash
# 安装 PostgreSQL
sudo apt-get install postgresql-15

# 创建数据库
sudo -u postgres psql
CREATE DATABASE docker_lab;
CREATE USER labuser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE docker_lab TO labuser;
```

#### 2. 后端

```bash
cd backend
npm install
npm run build

# 使用 PM2 管理进程
npm install -g pm2
pm2 start dist/main.js --name docker-lab-backend
pm2 save
pm2 startup
```

#### 3. 前端

```bash
cd frontend
npm install
npm run build

# 使用 PM2
pm2 start npm --name docker-lab-frontend -- start
```

#### 4. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 环境变量配置

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=docker_lab

# JWT
JWT_SECRET=your-very-secure-secret-key-min-32-chars

# Server
NODE_ENV=production
PORT=4000

# Docker
DOCKER_SOCKET=/var/run/docker.sock
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## 监控与日志

### 日志收集

```bash
# 后端日志
pm2 logs docker-lab-backend

# 容器日志
docker logs -f <container-id>

# 数据库日志
tail -f /var/log/postgresql/postgresql-15-main.log
```

### 性能监控

```bash
# PM2 监控
pm2 monit

# Docker 资源监控
docker stats

# 系统监控
htop
```

## 备份策略

### 数据库备份

```bash
# 备份
pg_dump -U postgres docker_lab > backup_$(date +%Y%m%d).sql

# 恢复
psql -U postgres docker_lab < backup_20240101.sql
```

### 自动备份脚本

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/docker-lab"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U postgres docker_lab | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近 7 天的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

## 故障排查

### 容器无法创建

```bash
# 检查 Docker 服务
sudo systemctl status docker

# 检查 Docker socket 权限
ls -l /var/run/docker.sock

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

### WebSocket 连接失败

```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 4000

# 检查 CORS 配置
# 确保 backend/src/main.ts 中的 CORS 配置正确
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 检查连接配置
psql -U postgres -h localhost -d docker_lab

# 查看连接数
SELECT count(*) FROM pg_stat_activity;
```

## 安全加固

### 1. 防火墙配置

```bash
# 只开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. SSL/TLS 配置

```bash
# 使用 Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 容器安全

```bash
# 限制容器资源
docker run --memory="512m" --cpus="1.0" ...

# 使用只读文件系统
docker run --read-only ...

# 禁用特权模式
# 永远不要使用 --privileged
```

## 性能调优

### PostgreSQL

```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
max_connections = 100
```

### Node.js

```bash
# 增加内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Docker

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```
