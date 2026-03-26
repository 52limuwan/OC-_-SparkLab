#!/bin/bash

# Spark Lab Agent 安装脚本
# 用法: curl -fsSL https://your-server/install.sh | bash -s -- <SERVER_URL> <TOKEN> <SERVER_NAME>

set -e

echo "================================"
echo "Spark Lab Agent 安装程序"
echo "================================"

# 检查参数
if [ $# -lt 3 ]; then
    echo "错误: 缺少参数"
    echo "用法: $0 <SERVER_URL> <TOKEN> <SERVER_NAME>"
    echo "示例: $0 http://lab.example.com:3001 your-secret-token Server-1"
    exit 1
fi

SERVER_URL=$1
AGENT_TOKEN=$2
SERVER_NAME=$3
MAX_CONTAINERS=${4:-10}

echo "服务器地址: $SERVER_URL"
echo "服务器名称: $SERVER_NAME"
echo "最大容器数: $MAX_CONTAINERS"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "错误: 请使用 root 权限运行此脚本"
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "✓ Docker 已安装"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✓ Node.js 已安装: $(node --version)"

# 创建安装目录
INSTALL_DIR="/opt/spark-lab-agent"
CONFIG_DIR="/etc/spark-lab-agent"

echo "正在创建目录..."
mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR

# 下载 Agent
echo "正在下载 Agent..."
cd $INSTALL_DIR

# 如果是开发环境，从本地复制
if [ -d "/tmp/spark-lab-agent" ]; then
    cp -r /tmp/spark-lab-agent/* .
else
    # 生产环境从服务器下载
    curl -fsSL $SERVER_URL/agent/download -o agent.tar.gz
    tar -xzf agent.tar.gz
    rm agent.tar.gz
fi

# 安装依赖
echo "正在安装依赖..."
npm install --production

# 创建配置文件
echo "正在创建配置文件..."
cat > $CONFIG_DIR/config.json <<EOF
{
  "serverUrl": "$SERVER_URL",
  "agentToken": "$AGENT_TOKEN",
  "serverName": "$SERVER_NAME",
  "maxContainers": $MAX_CONTAINERS
}
EOF

chmod 600 $CONFIG_DIR/config.json

# 创建 systemd 服务
echo "正在创建系统服务..."
cat > /etc/systemd/system/spark-lab-agent.service <<EOF
[Unit]
Description=Spark Lab Agent
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="CONFIG_PATH=$CONFIG_DIR/config.json"
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
systemctl daemon-reload

# 启动服务
echo "正在启动服务..."
systemctl enable spark-lab-agent
systemctl start spark-lab-agent

echo ""
echo "================================"
echo "✓ 安装完成！"
echo "================================"
echo ""
echo "服务状态: systemctl status spark-lab-agent"
echo "查看日志: journalctl -u spark-lab-agent -f"
echo "重启服务: systemctl restart spark-lab-agent"
echo "停止服务: systemctl stop spark-lab-agent"
echo ""
echo "配置文件: $CONFIG_DIR/config.json"
echo ""

# 显示服务状态
systemctl status spark-lab-agent --no-pager
