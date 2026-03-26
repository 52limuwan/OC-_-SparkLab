#!/bin/bash

# Spark Lab Agent 安装脚本 - Python 版本
# 支持 CentOS 7+ / Ubuntu 18.04+ / Debian 10+

set -e

echo "================================"
echo "Spark Lab Agent 安装程序 (Python)"
echo "================================"

# 检查参数
if [ $# -lt 3 ]; then
    echo "错误: 缺少参数"
    echo "用法: $0 <SERVER_URL> <TOKEN> <SERVER_NAME>"
    exit 1
fi

SERVER_URL=$1
AGENT_TOKEN=$2
SERVER_NAME=$3
MAX_CONTAINERS=${4:-10}

echo "服务器地址: $SERVER_URL"
echo "服务器名称: $SERVER_NAME"
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo "错误: 请使用 root 权限运行"
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "安装: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "✓ Docker 已安装"

# 安装 Python 3 和 pip
if ! command -v python3 &> /dev/null; then
    echo "正在安装 Python 3..."
    if [ -f /etc/debian_version ]; then
        apt-get update
        apt-get install -y python3 python3-pip
    elif [ -f /etc/redhat-release ]; then
        yum install -y python3 python3-pip
    fi
fi

echo "✓ Python 已安装: $(python3 --version)"

# 创建目录
INSTALL_DIR="/opt/spark-lab-agent"
CONFIG_DIR="/etc/spark-lab-agent"

mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR

# 复制 Agent 文件
echo "正在安装 Agent..."
cp agent.py $INSTALL_DIR/
chmod +x $INSTALL_DIR/agent.py

# 安装依赖
echo "正在安装 Python 依赖..."
pip3 install python-socketio[client]==5.7.0 docker==5.0.3 psutil==5.9.0 -i https://pypi.tuna.tsinghua.edu.cn/simple

# 创建配置
cat > $CONFIG_DIR/config.json <<EOF
{
  "serverUrl": "$SERVER_URL",
  "agentToken": "$AGENT_TOKEN",
  "serverName": "$SERVER_NAME",
  "maxContainers": $MAX_CONTAINERS
}
EOF

chmod 600 $CONFIG_DIR/config.json

# 配置 Docker TCP 端口
echo ""
echo "================================"
echo "配置 Docker TCP 端口"
echo "================================"

# 创建 daemon.json
echo "创建 /etc/docker/daemon.json..."
cat > /etc/docker/daemon.json <<EOF
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
EOF

# 创建 systemd override
echo "创建 systemd override 配置..."
mkdir -p /etc/systemd/system/docker.service.d
cat > /etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd
EOF

# 重启 Docker
echo "重启 Docker 服务..."
systemctl daemon-reload
systemctl restart docker

# 等待 Docker 启动
sleep 3

# 验证 Docker TCP 端口
echo "验证 Docker TCP 端口..."
if netstat -tlnp 2>/dev/null | grep -q 2375 || ss -tlnp 2>/dev/null | grep -q 2375; then
    echo "✓ Docker TCP 端口 2375 已启动"
else
    echo "✗ 警告: Docker TCP 端口 2375 未检测到"
fi

# 配置防火墙（如果使用 firewalld）
if systemctl is-active --quiet firewalld; then
    echo "配置防火墙..."
    # 获取后端服务器 IP（从 SERVER_URL 提取）
    BACKEND_IP=$(echo $SERVER_URL | sed -E 's|http://([^:]+):.*|\1|')
    echo "允许 $BACKEND_IP 访问 Docker TCP 端口..."
    firewall-cmd --permanent --add-rich-rule="rule family=\"ipv4\" source address=\"$BACKEND_IP\" port protocol=\"tcp\" port=\"2375\" accept" 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "✓ 防火墙已配置"
else
    echo "跳过防火墙配置（firewalld 未运行）"
fi

# 创建 systemd 服务
echo ""
echo "================================"
echo "创建 Agent 服务"
echo "================================"

cat > /etc/systemd/system/spark-lab-agent.service <<EOF
[Unit]
Description=Spark Lab Agent (Python)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="CONFIG_PATH=$CONFIG_DIR/config.json"
ExecStart=/usr/bin/python3 $INSTALL_DIR/agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable spark-lab-agent
systemctl start spark-lab-agent

echo ""
echo "================================"
echo "✓ 安装完成！"
echo "================================"
echo ""
echo "Agent 服务状态:"
systemctl status spark-lab-agent --no-pager
echo ""
echo "Docker TCP 端口状态:"
netstat -tlnp 2>/dev/null | grep 2375 || ss -tlnp 2>/dev/null | grep 2375 || echo "未检测到"
echo ""
echo "常用命令:"
echo "  查看 Agent 状态: systemctl status spark-lab-agent"
echo "  查看 Agent 日志: journalctl -u spark-lab-agent -f"
echo "  重启 Agent: systemctl restart spark-lab-agent"
echo "  停止 Agent: systemctl stop spark-lab-agent"
echo ""
echo "⚠️  安全提示: Docker TCP 端口 2375 已开放"
echo "   请确保防火墙已正确配置，只允许信任的 IP 访问！"
echo ""
