# Docker TCP 端口配置指南

## 方案说明
我们改用 Docker SDK (dockerode) 直接通过 TCP 连接到远程服务器的 Docker，不再使用 Agent 的 WebSocket 方式。

## 优点
- 更简单，不需要维护 Agent 代码
- 更可靠，直接使用 Docker 官方 API
- 更快速，减少中间层

## 配置步骤

### 1. 在远程服务器上配置 Docker 监听 TCP 端口

#### CentOS 7 配置方法

编辑 Docker 服务配置：
```bash
sudo vi /etc/docker/daemon.json
```

添加以下内容（如果文件不存在则创建）：
```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
```

修改 systemd 服务文件：
```bash
sudo vi /etc/systemd/system/docker.service.d/override.conf
```

如果目录不存在，先创建：
```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
```

添加以下内容：
```ini
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd
```

重新加载并重启 Docker：
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

验证配置：
```bash
# 检查 Docker 是否监听 2375 端口
sudo netstat -tlnp | grep 2375

# 或使用 ss 命令
sudo ss -tlnp | grep 2375

# 测试连接
curl http://localhost:2375/version
```

### 2. 安全注意事项

⚠️ **重要**：直接暴露 Docker TCP 端口是不安全的！

#### 推荐的安全措施：

**方案 A：使用防火墙限制访问**
```bash
# 只允许特定 IP 访问
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.43.24" port protocol="tcp" port="2375" accept'
sudo firewall-cmd --reload
```

**方案 B：使用 TLS 加密（推荐生产环境）**

生成证书：
```bash
# 创建证书目录
mkdir -p /etc/docker/certs

# 生成 CA 私钥
openssl genrsa -aes256 -out /etc/docker/certs/ca-key.pem 4096

# 生成 CA 证书
openssl req -new -x509 -days 365 -key /etc/docker/certs/ca-key.pem -sha256 -out /etc/docker/certs/ca.pem

# 生成服务器私钥
openssl genrsa -out /etc/docker/certs/server-key.pem 4096

# 生成服务器证书签名请求
openssl req -subj "/CN=192.168.43.24" -sha256 -new -key /etc/docker/certs/server-key.pem -out /etc/docker/certs/server.csr

# 签名服务器证书
echo subjectAltName = IP:192.168.43.24,IP:127.0.0.1 >> /etc/docker/certs/extfile.cnf
echo extendedKeyUsage = serverAuth >> /etc/docker/certs/extfile.cnf
openssl x509 -req -days 365 -sha256 -in /etc/docker/certs/server.csr -CA /etc/docker/certs/ca.pem -CAkey /etc/docker/certs/ca-key.pem -CAcreateserial -out /etc/docker/certs/server-cert.pem -extfile /etc/docker/certs/extfile.cnf
```

修改 `/etc/docker/daemon.json`：
```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2376"],
  "tls": true,
  "tlscacert": "/etc/docker/certs/ca.pem",
  "tlscert": "/etc/docker/certs/server-cert.pem",
  "tlskey": "/etc/docker/certs/server-key.pem",
  "tlsverify": true
}
```

**方案 C：使用 SSH 隧道（最简单安全）**

在后端服务器上创建 SSH 隧道：
```bash
# 建立隧道，将远程 2375 端口映射到本地
ssh -L 2375:localhost:2375 root@192.168.43.24 -N -f
```

然后在代码中连接 `localhost:2375` 即可。

### 3. 更新数据库中的服务器配置

在服务器管理页面，编辑服务器信息：
- Host: 远程服务器 IP（如 `192.168.43.24`）
- Port: 2375（或 2376 如果使用 TLS）

或者直接在数据库中更新：
```sql
UPDATE Server SET host = '192.168.43.24', port = 2375 WHERE name = 'vm1';
```

### 4. 测试连接

重启后端服务后，点击"查看容器"按钮，应该能看到远程服务器上的所有容器。

## 如果使用 TLS

需要修改 `backend/src/server/server.service.ts` 中的 Docker 连接代码：

```typescript
const docker = new Docker({
  host: server.host,
  port: 2376, // TLS 端口
  ca: fs.readFileSync('/path/to/ca.pem'),
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem'),
});
```

## 故障排查

### 问题：连接超时
- 检查防火墙是否允许 2375 端口
- 检查 Docker 是否正在监听该端口：`netstat -tlnp | grep 2375`

### 问题：权限被拒绝
- 确保 Docker daemon 配置正确
- 检查 SELinux 设置：`getenforce`（如果是 Enforcing，可能需要配置规则）

### 问题：证书错误（使用 TLS 时）
- 确保证书路径正确
- 确保证书的 CN 或 SAN 包含服务器 IP
- 检查证书是否过期

## 回退到 Agent 方式

如果 TCP 方式有问题，可以回退到 Agent 方式：
1. 恢复 `server.service.ts` 中的 `listServerContainers` 方法
2. 在远程服务器上启动 Agent：`systemctl start spark-lab-agent`
