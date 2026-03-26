# Spark Lab Agent 部署完成指南

## 当前状态

✅ Agent 已安装并运行
❌ Agent 未连接到中心服务器（显示离线）

## 排查步骤

### 1. 检查 Agent 日志

```bash
# 查看实时日志
journalctl -u spark-lab-agent -f

# 查看最近 50 行日志
journalctl -u spark-lab-agent -n 50
```

查找以下信息：
- `[Agent] 连接` - 表示正在尝试连接
- `[Agent] 已连接` - 表示连接成功
- 错误信息 - 连接失败原因

### 2. 检查网络连接

```bash
# 测试能否访问中心服务器
curl http://192.168.43.24:3001/

# 测试 WebSocket 端口
telnet 192.168.43.24 3001
```

### 3. 检查后端服务

确保后端服务正在运行并且 WebSocket 已启动：

```bash
# 在后端服务器上
cd backend
npm run start:dev
```

查看启动日志，应该看到：
- `Nest application successfully started`
- WebSocket 相关的启动信息

### 4. 检查防火墙

```bash
# CentOS 7
firewall-cmd --list-all

# 如果需要开放端口
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

### 5. 手动测试 Agent

```bash
# 停止服务
systemctl stop spark-lab-agent

# 手动运行查看详细输出
cd /opt/spark-lab-agent
CONFIG_PATH=/etc/spark-lab-agent/config.json python3 agent.py
```

## 常见问题

### 问题1：ModuleNotFoundError

**症状**：`ModuleNotFoundError: No module named 'socketio'`

**解决**：
```bash
pip3 install python-socketio[client] docker psutil -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题2：连接被拒绝

**症状**：`Connection refused` 或 `Connection error`

**原因**：
- 后端服务未启动
- 防火墙阻止
- IP 地址错误

**解决**：
1. 确认后端运行：`curl http://192.168.43.24:3001/`
2. 检查防火墙
3. 确认配置文件中的 serverUrl 正确

### 问题3：Token 验证失败

**症状**：Agent 连接后立即断开

**原因**：Token 或服务器名称不匹配

**解决**：
1. 检查配置文件：`cat /etc/spark-lab-agent/config.json`
2. 确认 Token 和服务器名称与数据库中的一致
3. 重新生成服务器并获取新 Token

### 问题4：服务器显示离线但 Agent 运行正常

**原因**：
- WebSocket 连接未建立
- 后端 AgentGateway 未正确配置
- 数据库中服务器记录问题

**解决**：
1. 重启后端服务
2. 检查后端日志
3. 重启 Agent：`systemctl restart spark-lab-agent`

## 配置文件位置

- Agent 代码：`/opt/spark-lab-agent/agent.py`
- 配置文件：`/etc/spark-lab-agent/config.json`
- 服务文件：`/etc/systemd/system/spark-lab-agent.service`
- 日志：`journalctl -u spark-lab-agent`

## 配置文件示例

```json
{
  "serverUrl": "http://192.168.43.24:3001",
  "agentToken": "f479a87e2cafc7f79090cf615145dbf0",
  "serverName": "Server-1",
  "maxContainers": 10
}
```

## 服务管理命令

```bash
# 启动
systemctl start spark-lab-agent

# 停止
systemctl stop spark-lab-agent

# 重启
systemctl restart spark-lab-agent

# 查看状态
systemctl status spark-lab-agent

# 查看日志
journalctl -u spark-lab-agent -f

# 开机自启
systemctl enable spark-lab-agent

# 禁用自启
systemctl disable spark-lab-agent
```

## 卸载 Agent

```bash
systemctl stop spark-lab-agent
systemctl disable spark-lab-agent
rm -rf /opt/spark-lab-agent
rm -rf /etc/spark-lab-agent
rm /etc/systemd/system/spark-lab-agent.service
systemctl daemon-reload
```

## 下一步

1. **查看 Agent 日志**：`journalctl -u spark-lab-agent -f`
2. **确认后端运行**：检查后端是否正常启动
3. **测试连接**：手动运行 Agent 查看详细输出
4. **检查数据库**：确认服务器记录正确

## 预期行为

当一切正常时：

1. Agent 启动后会输出：
   ```
   [Agent] http://192.168.43.24:3001
   [Agent] 启动
   [Agent] 连接
   ```

2. 管理后台显示：
   - 服务器状态：在线（绿色）
   - CPU 使用率：实时数据
   - 内存使用率：实时数据
   - 活跃容器数：实时数据

3. 每 30 秒 Agent 会发送心跳更新统计信息

## 技术架构

```
远程服务器 (CentOS 7)
    ↓
Python Agent (systemd 服务)
    ↓
WebSocket 连接
    ↓
中心服务器 (NestJS)
    ↓
AgentGateway + AgentService
    ↓
数据库 (SQLite/PostgreSQL)
```

## 需要帮助？

如果问题仍然存在，请提供：
1. Agent 日志：`journalctl -u spark-lab-agent -n 100`
2. 后端日志
3. 配置文件内容：`cat /etc/spark-lab-agent/config.json`
4. 网络测试结果：`curl http://192.168.43.24:3001/`
