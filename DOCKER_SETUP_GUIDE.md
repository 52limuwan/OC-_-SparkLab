# Docker 实验环境配置指南

## 概述

本指南说明如何使用新完善的 Docker 功能来配置实验环境。系统现在支持通过 Docker SDK 进行完整的容器管理，包括：

- 连接远程 Docker 服务器
- 配置完整的容器参数（环境变量、端口映射、卷挂载等）
- 在容器内执行命令（exec_create 和 exec_start）

## 数据库字段说明

在 `Lab` 模型中新增了以下字段用于 Docker 高级配置：

### 环境变量 (environment)
- **类型**: JSON 字符串
- **格式**: `{"KEY": "value", "KEY2": "value2"}`
- **示例**:
```json
{
  "MYSQL_ROOT_PASSWORD": "123456",
  "MYSQL_DATABASE": "mydb"
}
```

### 端口映射 (ports)
- **类型**: JSON 字符串
- **格式**: `{"containerPort/protocol": hostPort}`
- **示例**:
```json
{
  "3306/tcp": 3306,
  "8080/tcp": 8080
}
```

### 卷挂载 (volumes)
- **类型**: JSON 字符串
- **格式**: `{"/host/path": {"bind": "/container/path", "mode": "rw"}}`
- **示例**:
```json
{
  "/mydata/mysql/log": {"bind": "/var/log/mysql", "mode": "rw"},
  "/mydata/mysql/data": {"bind": "/var/lib/mysql", "mode": "rw"},
  "/mydata/mysql/conf": {"bind": "/etc/mysql", "mode": "rw"}
}
```

### 重启策略 (restartPolicy)
- **类型**: JSON 字符串
- **格式**: `{"Name": "policy"}`
- **可选值**:
  - `no` - 不自动重启
  - `always` - 总是自动重启
  - `on-failure` - 失败时重启
  - `unless-stopped` - 除非手动停止，否则自动重启
- **示例**:
```json
{"Name": "unless-stopped"}
```

### 其他字段
- `networkMode`: 网络模式（如 "bridge", "host", "none"）
- `hostname`: 容器主机名
- `workingDir`: 工作目录
- `labels`: 容器标签（JSON 格式）

## 完整示例：MySQL 实验

### 实验配置示例

假设你要创建一个 MySQL 实验：

```json
{
  "title": "MySQL 数据库实验",
  "dockerImage": "mysql:5.7",
  "cpuLimit": 1.0,
  "memoryLimit": 1024,
  "environment": "{\"MYSQL_ROOT_PASSWORD\": \"123456\", \"MYSQL_DATABASE\": \"lab_db\"}",
  "ports": "{\"3306/tcp\": 3306}",
  "volumes": "{\"/mydata/mysql/log\": {\"bind\": \"/var/log/mysql\", \"mode\": \"rw\"}, \"/mydata/mysql/data\": {\"bind\": \"/var/lib/mysql\", \"mode\": \"rw\"}}",
  "restartPolicy": "{\"Name\": \"unless-stopped\"}"
}
```

### Python SDK 示例（参考）

```python
import docker

# 连接到远程 Docker 服务器
client = docker.DockerClient(base_url='tcp://10.0.0.2:2375')

# 启动一个 MySQL 容器
container = client.containers.run(
    'mysql:5.7',
    name='mysql-lab',
    detach=True,
    ports={'3306/tcp': 3306},
    volumes={
        '/mydata/mysql/log': {'bind': '/var/log/mysql', 'mode': 'rw'},
        '/mydata/mysql/data': {'bind': '/var/lib/mysql', 'mode': 'rw'},
        '/mydata/mysql/conf': {'bind': '/etc/mysql', 'mode': 'rw'}
    },
    environment={'MYSQL_ROOT_PASSWORD': '123456'},
    restart_policy={'Name': 'unless-stopped'}
)

print(f"容器 {container.name} 启动成功，ID: {container.id}")
```

## API 端点说明

### 容器管理

#### 创建容器
```
POST /containers
Body: { "labId": "lab-uuid" }
```

#### 执行命令（单次）
```
POST /containers/:id/exec
Body: { "command": "ls -la" }
```

#### 创建 exec 实例
```
POST /containers/:id/exec/create
Body: {
  "command": "/bin/bash",
  "options": {
    "tty": true,
    "stdin": true,
    "stdout": true,
    "stderr": true
  }
}
Response: { "execId": "exec-instance-id" }
```

#### 启动 exec 实例
```
POST /containers/:id/exec/start
Body: {
  "execId": "exec-instance-id",
  "options": {
    "stream": false,
    "detach": false,
    "tty": true
  }
}
Response: { "output": "command output..." }
```

## 数据库迁移

在使用新字段之前，需要运行数据库迁移：

```bash
cd backend
npm run prisma:migrate
```

## 注意事项

1. **卷挂载路径**: 确保宿主机上的路径存在且有正确的权限
2. **端口冲突**: 确保映射的端口在宿主机上未被占用
3. **安全**: 不要在生产环境中暴露 Docker TCP 端口（2375）而不加认证
4. **资源限制**: 根据服务器配置合理设置 CPU 和内存限制
