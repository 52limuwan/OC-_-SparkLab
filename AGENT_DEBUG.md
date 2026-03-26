# Agent 连接问题诊断

## 当前状态
- Agent 服务已启动但无连接日志
- 后端显示服务器离线
- 服务器名称显示为 "1" 而不是 "Server-1"

## 诊断步骤

### 1. 检查 Agent 详细日志
```bash
# 查看完整日志（包括错误）
journalctl -u spark-lab-agent -n 50 --no-pager

# 实时查看日志
journalctl -u spark-lab-agent -f
```

### 2. 手动运行 Agent（调试模式）
```bash
# 停止服务
systemctl stop spark-lab-agent

# 手动运行查看详细输出
cd /opt/spark-lab-agent
CONFIG_PATH=/etc/spark-lab-agent/config.json python3 agent.py
```

### 3. 检查配置文件
```bash
cat /etc/spark-lab-agent/config.json
```

应该看到：
```json
{
  "serverUrl": "http://192.168.43.24:3001",
  "agentToken": "f479a87e2cafc7f79090cf615145dbf0",
  "serverName": "Server-1",
  "maxContainers": 10
}
```

### 4. 测试网络连接
```bash
# 测试后端是否可访问
curl http://192.168.43.24:3001/

# 测试 WebSocket 端点
curl http://192.168.43.24:3001/socket.io/
```

### 5. 检查 Python 依赖
```bash
python3 -c "import socketio; print(socketio.__version__)"
python3 -c "import docker; print(docker.__version__)"
python3 -c "import psutil; print(psutil.__version__)"
```

## 已知问题修复

### 问题 1: Socket.IO 连接 URL 错误
**症状**: Agent 无法连接到后端

**原因**: 之前的代码使用 `self.s.connect(f"{serverUrl}/agent")` 是错误的

**修复**: 已更新为 `self.s.connect(serverUrl, namespaces=['/agent'])`

### 问题 2: 需要重新安装 Agent
由于修复了连接代码，需要在服务器上重新安装：

```bash
# 停止并删除旧服务
systemctl stop spark-lab-agent
systemctl disable spark-lab-agent
rm -rf /opt/spark-lab-agent /etc/spark-lab-agent /etc/systemd/system/spark-lab-agent.service

# 重新安装（使用新的安装脚本）
curl -fsSL http://192.168.43.24:3001/agent/install.sh | bash -s -- http://192.168.43.24:3001 f479a87e2cafc7f79090cf615145dbf0 Server-1
```

## 后端检查

### 检查后端 WebSocket 是否启动
后端日志应该显示：
```
🚀 Spark Lab Backend running on http://localhost:3001
```

### 检查 AgentModule 是否加载
在 `backend/src/app.module.ts` 中应该有：
```typescript
imports: [
  // ...
  AgentModule,
]
```

### 检查 WebSocket 网关配置
`backend/src/agent/agent.gateway.ts` 应该有：
```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/agent',
})
```

## 预期行为

### Agent 启动时应该看到：
```
[Agent] 连接到: http://192.168.43.24:3001
[Agent] 已连接到中心服务器
[Agent] 启动，按 Ctrl+C 退出
```

### 后端日志应该显示：
```
[AgentGateway] Agent 尝试连接: Server-1 (socket-id)
[AgentGateway] Agent 已连接: Server-1
[AgentService] Agent 已注册: Server-1 (server-id)
```

### 前端应该显示：
- 服务器名称: "Server-1"
- 状态: 在线（绿色）
- CPU/内存使用率: 实际数值（不是 0.0%）

## 下一步操作

1. 先在服务器上手动运行 Agent（步骤 2）查看详细错误
2. 如果看到连接错误，检查网络和防火墙
3. 如果看到认证错误，检查 Token 是否匹配
4. 确认问题后，重新安装 Agent
