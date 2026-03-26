# 容器列表功能修复

## 问题描述
点击"查看容器"按钮时，后端发送 `docker:list` 事件到 Agent，但 Agent 没有收到该事件，导致前端显示错误：`Failed to list containers: Agent 未响应`

## 根本原因
1. **Socket.IO 命名空间访问错误**：在 `agent.gateway.ts` 中使用了错误的方式访问命名空间的 socket
   - 错误：`this.server.sockets.sockets.get(agentId)` 
   - 正确：`this.server.of('/agent').sockets.get(agentId)`

2. **响应格式不一致**：Python Agent 的 `handle_list` 方法返回格式与后端期望不匹配
   - 旧格式：`{'success': True, 'containers': [...]}`
   - 新格式：`{'success': True, 'data': {'containers': [...]}}`

## 已修复的文件

### 1. backend/src/agent/agent.gateway.ts
- 修复了 socket 访问方式：使用 `this.server.of('/agent').sockets.get(agentId)`
- 增强了日志输出，便于调试：
  - 发送事件时记录详细信息
  - 接收响应时记录完整数据
  - 错误情况下记录具体原因

### 2. agent-python/agent.py
- 修复了 `handle_list` 方法的返回格式，使用嵌套的 data 结构
- 增强了 `docker:list` 事件处理器的日志输出
- 添加了回调函数调用的日志

### 3. backend/src/server/server.service.ts
- 改进了日志输出，使用中文便于阅读
- 保持了错误处理逻辑

## 测试步骤

### 1. 重启后端服务
```bash
cd backend
npm run start:dev
```

### 2. 重启 Agent（在远程服务器上）
```bash
# 停止旧的 Agent
systemctl stop spark-lab-agent

# 上传新的 agent.py 文件到 /opt/spark-lab-agent/

# 手动运行测试
cd /opt/spark-lab-agent
CONFIG_PATH=/etc/spark-lab-agent/config.json python3 agent.py
```

### 3. 测试容器列表功能
1. 打开浏览器访问服务器管理页面
2. 找到在线的服务器
3. 点击"查看容器"按钮
4. 观察：
   - 后端日志应显示：`发送事件 docker:list 到 Agent xxx`
   - Agent 日志应显示：`[Agent] 收到 docker:list 请求`
   - 前端应显示容器列表模态框

### 4. 查看日志
**后端日志应包含：**
```
[AgentGateway] 发送事件 docker:list 到 Agent xxx, 数据: {}
[AgentGateway] 收到 Agent 响应: {"success":true,"data":{"containers":[...]}}
[ServerService] 请求服务器 xxx 的容器列表
[ServerService] 收到容器列表响应: {"containers":[...]}
```

**Agent 日志应包含：**
```
[Agent] 收到 docker:list 请求, 数据: {}
[Agent] 返回容器列表: X 个容器
[Agent] 调用回调函数返回结果
```

## 预期结果
- ✅ Agent 能够接收到 `docker:list` 事件
- ✅ Agent 正确返回容器列表
- ✅ 后端能够接收并处理响应
- ✅ 前端显示容器列表模态框，包含所有容器信息

## 如果仍然有问题

### 检查清单
1. **确认 Agent 已连接**：服务器状态显示"在线"
2. **确认 Socket ID 正确**：后端日志中的 Agent ID 应该与 Agent 连接时的 socket ID 一致
3. **确认命名空间正确**：Agent 应该连接到 `/agent` 命名空间
4. **检查 Docker 权限**：Agent 用户需要有权限访问 Docker socket

### 调试命令
```bash
# 在远程服务器上检查 Docker 容器
docker ps -a

# 检查 Agent 进程
ps aux | grep agent.py

# 查看 Agent 日志（如果使用 systemd）
journalctl -u spark-lab-agent -f
```

## 后续优化建议
1. 添加容器详情查看功能
2. 添加容器操作功能（启动、停止、删除）
3. 添加容器日志查看功能
4. 添加容器资源使用情况监控
