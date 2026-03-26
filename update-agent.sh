#!/bin/bash
# 更新远程服务器上的 Agent

echo "=== Spark Lab Agent 更新脚本 ==="
echo ""

# 检查是否提供了服务器地址
if [ -z "$1" ]; then
    echo "用法: ./update-agent.sh <服务器地址>"
    echo "示例: ./update-agent.sh root@192.168.43.24"
    exit 1
fi

SERVER=$1

echo "1. 停止 Agent 服务..."
ssh $SERVER "systemctl stop spark-lab-agent"

echo "2. 备份旧的 agent.py..."
ssh $SERVER "cp /opt/spark-lab-agent/agent.py /opt/spark-lab-agent/agent.py.backup"

echo "3. 上传新的 agent.py..."
scp agent-python/agent.py $SERVER:/opt/spark-lab-agent/

echo "4. 启动 Agent 服务..."
ssh $SERVER "systemctl start spark-lab-agent"

echo "5. 检查服务状态..."
ssh $SERVER "systemctl status spark-lab-agent"

echo ""
echo "=== 更新完成 ==="
echo "查看实时日志: ssh $SERVER 'journalctl -u spark-lab-agent -f'"
