# Spark Lab Agent 使用指南

## 概述

Spark Lab Agent 是一个轻量级的服务器代理程序，安装在远程服务器上后，会主动连接到中心服务器，无需开放 SSH 端口，类似 Cloudflare Tunnel 的工作方式。

## 架构优势

### 传统 SSH 方式的问题
- ❌ 需要开放 SSH 端口，安全风险高
- ❌ 需要配置防火墙规则
- ❌ 需要管理 SSH 密钥
- ❌ 网络连接不稳定时容易断开

### Agent 方式的优势
- ✅ 服务器主动连接，无需开放端口
- ✅ 基于 Token 认证，更安全
- ✅ 自动重连机制
- ✅ 实时心跳监控
- ✅ 安装简单，一键部署

## 快速开始

### 1. 在管理后台创建服务器

1. 登录管理员账号
2. 进入 **服务器管理** 页面
3. 点击 **添加服务器**
4. 填写服务器信息：
   - 服务器名称：如 "实验服务器1"
   - 最大容器数：10
   - CPU 核心数：4
   - 内存大小：8192MB

5. 点击 **创建**
6. **重要**：立即复制显示的 Agent Token 和安装命令

### 2. 在远程服务器上安装 Agent

#### 前置要求
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Docker 已安装
- Root 权限

#### 安装 Docker（如果未安装）
```bash
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

#### 安装 Agent
```bash
# 使用管理后台提供的安装命令
curl -fsSL http://your-server:3001/agent/install.sh | bash -s -- \
  http://your-server:3001 \
  your-agent-token \
  Server-1
```

参数说明：
- 第1个参数：中心服务器地址
- 第2个参数：Agent Token
- 第3个参数：服务器名称
- 第4个参数（可选）：最大容器数，默认 10

### 3. 验证安装

#### 查看服务状态
```bash
systemctl status spark-lab-agent
```

#### 查看实时日志
```bash
journalctl -u spark-lab-agent -f
```

#### 检查连接
返回管理后台，刷新页面，服务器状态应该显示为 **在线**。

## Agent 管理

### 启动服务
```bash
systemctl start spark-lab-agent
```

### 停止服务
```bash
systemctl stop spark-lab-agent
```

### 重启服务
```bash
systemctl restart spark-lab-agent
```

### 开机自启
```bash
systemctl enable spark-lab-agent
```

### 禁用自启
```bash
systemctl disable spark-lab-agent
```

### 卸载 Agent
```bash
systemctl stop spark-lab-agent
systemctl disable spark-lab-agent
rm -rf /opt/spark-lab-agent
rm -rf /etc/spark-lab-agent
rm /etc/systemd/system/spark-lab-agent.service
systemctl daemon-reload
```

## 配置文件

配置文件位置：`/etc/spark-lab-agent/config.json`

```json
{
  "serverUrl": "http://your-server:3001",
  "agentToken": "your-secret-token",
  "serverName": "Server-1",
  "maxContainers": 10
}
```

修改配置后需要重启服务：
```bash
systemctl restart spark-lab-agent
```

## 工作原理

### 连接流程

```
1. Agent 启动
   ↓
2. 读取配置文件
   ↓
3. 连接到中心服务器 (WebSocket)
   ↓
4. 发送 Token 和服务器名称
   ↓
5. 中心服务器验证 Token
   ↓
6. 连接成功，开始心跳
```

### 心跳机制

Agent 每 30 秒发送一次心跳，包含：
- CPU 使用率
- 内存使用率
- 活跃容器数
- 时间戳

如果心跳超时，中心服务器会将服务器标记为离线。

### 指令执行

当需要在远程服务器上操作 Docker 时：

```
中心服务器
   ↓ (发送指令)
Agent 接收
   ↓
执行 Docker 操作
   ↓
返回结果
   ↓
中心服务器
```

支持的指令：
- `docker:create` - 创建容器
- `docker:start` - 启动容器
- `docker:stop` - 停止容器
- `docker:remove` - 删除容器
- `docker:exec` - 执行命令
- `docker:commit` - 创建快照
- `system:stats` - 获取系统状态

## 故障排查

### Agent 无法连接

1. 检查网络连接
```bash
ping your-server-domain
```

2. 检查服务状态
```bash
systemctl status spark-lab-agent
```

3. 查看日志
```bash
journalctl -u spark-lab-agent -n 50
```

4. 验证 Token
检查 `/etc/spark-lab-agent/config.json` 中的 Token 是否正确

5. 检查防火墙
确保服务器可以访问中心服务器的端口（默认 3001）

### 服务器显示离线

1. 检查 Agent 是否运行
```bash
systemctl status spark-lab-agent
```

2. 重启 Agent
```bash
systemctl restart spark-lab-agent
```

3. 检查日志
```bash
journalctl -u spark-lab-agent -f
```

### 容器创建失败

1. 检查 Docker 是否运行
```bash
systemctl status docker
```

2. 检查磁盘空间
```bash
df -h
```

3. 检查内存
```bash
free -h
```

4. 查看 Docker 日志
```bash
docker logs <container-id>
```

## 安全建议

1. **保护 Token**
   - Token 相当于服务器的访问密钥
   - 不要在公开场合分享
   - 定期更换 Token

2. **限制网络访问**
   - 只允许 Agent 访问中心服务器
   - 使用防火墙限制出站连接

3. **监控日志**
   - 定期检查 Agent 日志
   - 关注异常连接和操作

4. **及时更新**
   - 保持 Agent 版本最新
   - 及时更新 Docker

## 开发和调试

### 本地开发

```bash
cd agent
npm install
npm run dev
```

### 构建

```bash
npm run build
```

### 测试连接

```bash
# 设置环境变量
export CONFIG_PATH=/path/to/config.json

# 运行
node dist/index.js
```

## 与 SSH 方案对比

| 特性 | SSH 方案 | Agent 方案 |
|------|---------|-----------|
| 端口开放 | 需要开放 SSH 端口 | 无需开放端口 |
| 防火墙配置 | 复杂 | 简单 |
| 安全性 | 中等 | 高 |
| 连接稳定性 | 一般 | 优秀 |
| 安装难度 | 中等 | 简单 |
| 维护成本 | 高 | 低 |
| 自动重连 | 不支持 | 支持 |
| 实时监控 | 需要轮询 | 实时心跳 |

## 总结

Spark Lab Agent 提供了一种更安全、更简单的远程服务器管理方式。通过主动连接和心跳机制，实现了类似 Cloudflare Tunnel 的零信任架构，无需开放端口，安装简单，维护方便。
