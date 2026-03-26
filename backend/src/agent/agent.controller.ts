import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('agent')
export class AgentController {
  @Get('install.sh')
  getInstallScript(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(this.getCompleteInstallScript());
  }

  private getCompleteInstallScript(): string {
    // 读取 agent.py 文件内容
    const agentPyPath = path.join(__dirname, '../../../agent-python/agent.py');
    let agentPyContent = '';
    
    try {
      agentPyContent = fs.readFileSync(agentPyPath, 'utf-8');
    } catch (error) {
      // 如果文件不存在，使用内嵌版本
      agentPyContent = this.getEmbeddedAgentPy();
    }

    return `#!/bin/bash
# Spark Lab Agent 一键安装脚本
# 自动配置 Docker TCP 端口 + 安装 Agent

set -e

# 颜色定义
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo -e "\${RED}Spark Lab Agent 一键安装\${NC}"
echo ""

# 检查参数
if [ $# -lt 3 ]; then
    echo -e "\${RED}错误: 缺少参数\${NC}"
    echo "用法: bash install.sh <SERVER_URL> <TOKEN> <SERVER_NAME>"
    echo "示例: bash install.sh http://192.168.43.24:3001 your-token vm1"
    exit 1
fi

SERVER_URL=$1
AGENT_TOKEN=$2
SERVER_NAME=$3

echo "服务器地址: $SERVER_URL"
echo "服务器名称: $SERVER_NAME"
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo -e "\${RED}错误: 请使用 root 权限运行\${NC}"
    echo "使用: sudo bash install.sh ..."
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "\${RED}错误: Docker 未安装\${NC}"
    echo ""
    echo "请先安装 Docker，推荐使用以下命令（国内镜像源）："
    echo ""
    echo -e "\${RED}1. 更换系统软件源（可选但推荐）:\${NC}"
    echo "   bash <(curl -sSL https://gitee.com/SuperManito/LinuxMirrors/raw/main/ChangeMirrors.sh)"
    echo ""
    echo -e "\${RED}2. 安装 Docker:\${NC}"
    echo "   bash <(curl -sSL https://gitee.com/SuperManito/LinuxMirrors/raw/main/DockerInstallation.sh)"
    echo ""
    echo "安装完成后，请重新运行本脚本"
    exit 1
fi

echo "Docker 已安装"

# 安装 Python 3
if ! command -v python3 &> /dev/null; then
    echo "正在安装 Python 3..."
    if [ -f /etc/debian_version ]; then
        apt-get update
        apt-get install -y python3 python3-pip python3-dev gcc
    elif [ -f /etc/redhat-release ]; then
        yum install -y python3 python3-pip python3-devel gcc
    fi
else
    # Python 已安装，但需要确保有开发包
    echo "检查 Python 开发包..."
    if [ -f /etc/debian_version ]; then
        apt-get install -y python3-dev gcc 2>/dev/null || true
    elif [ -f /etc/redhat-release ]; then
        yum install -y python3-devel gcc 2>/dev/null || true
    fi
fi

echo "Python 已安装: $(python3 --version)"

# 创建目录
echo ""
echo -e "\${RED}步骤 1: 创建安装目录\${NC}"

INSTALL_DIR="/opt/spark-lab-agent"
CONFIG_DIR="/etc/spark-lab-agent"

mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR

# 创建 agent.py
echo "创建 Agent 程序..."
cat > $INSTALL_DIR/agent.py <<'AGENT_PY_EOF'
${agentPyContent}
AGENT_PY_EOF

chmod +x $INSTALL_DIR/agent.py
echo "Agent 程序已创建"

# 安装 Python 依赖
echo ""
echo -e "\${RED}步骤 2: 安装 Python 依赖\${NC}"

pip3 install python-socketio[client]==5.7.0 docker==5.0.3 psutil==5.9.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
echo "Python 依赖已安装"

# 创建配置文件
echo ""
echo -e "\${RED}步骤 3: 创建配置文件\${NC}"

cat > $CONFIG_DIR/config.json <<EOF
{
  "serverUrl": "$SERVER_URL",
  "agentToken": "$AGENT_TOKEN",
  "serverName": "$SERVER_NAME"
}
EOF

chmod 600 $CONFIG_DIR/config.json
echo "配置文件已创建"

# 配置 Docker TCP 端口
echo ""
echo -e "\${RED}步骤 4: 配置 Docker TCP 端口\${NC}"

# 备份原有配置
if [ -f /etc/docker/daemon.json ]; then
    cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    echo "已备份原有配置"
fi

# 创建 daemon.json
cat > /etc/docker/daemon.json <<EOF
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
EOF

echo "已创建 /etc/docker/daemon.json"

# 创建 systemd override
mkdir -p /etc/systemd/system/docker.service.d
cat > /etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd
EOF

echo "已创建 systemd override"

# 重启 Docker
echo "重启 Docker 服务..."
systemctl daemon-reload
systemctl restart docker

# 等待 Docker 启动
sleep 3

# 验证 Docker TCP 端口
if netstat -tlnp 2>/dev/null | grep -q 2375 || ss -tlnp 2>/dev/null | grep -q 2375; then
    echo "Docker TCP 端口 2375 已启动"
else
    echo -e "\${RED}警告: Docker TCP 端口 2375 未检测到\${NC}"
fi

# 配置防火墙
if systemctl is-active --quiet firewalld; then
    echo "配置防火墙..."
    BACKEND_IP=$(echo $SERVER_URL | sed -E 's|http://([^:]+):.*|\\1|')
    firewall-cmd --permanent --add-rich-rule="rule family=\\"ipv4\\" source address=\\"$BACKEND_IP\\" port protocol=\\"tcp\\" port=\\"2375\\" accept" 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "防火墙已配置（允许 $BACKEND_IP 访问）"
fi

# 创建 Agent 服务
echo ""
echo -e "\${RED}步骤 5: 创建 Agent 服务\${NC}"

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

echo "Agent 服务已启动"

# 显示状态
echo ""
echo -e "\${RED}安装完成\${NC}"
echo ""
echo "Agent 服务状态:"
systemctl status spark-lab-agent --no-pager -l | head -20
echo ""
echo "Docker TCP 端口:"
netstat -tlnp 2>/dev/null | grep 2375 || ss -tlnp 2>/dev/null | grep 2375 || echo "未检测到"
echo ""
echo "常用命令:"
echo "  查看日志: journalctl -u spark-lab-agent -f"
echo "  重启服务: systemctl restart spark-lab-agent"
echo "  停止服务: systemctl stop spark-lab-agent"
echo ""
echo -e "\${RED}安全提示:\${NC}"
echo "   Docker TCP 端口 2375 已开放，请确保防火墙配置正确！"
echo "   建议只允许信任的 IP 地址访问此端口。"
echo ""
`;
  }

  private getEmbeddedAgentPy(): string {
    return `#!/usr/bin/env python3
"""Spark Lab Agent - Python 版本"""
import json, os, sys, time, socketio, docker, psutil
from threading import Thread

class SparkLabAgent:
    def __init__(self, config_path):
        self.config = json.load(open(config_path))
        self.docker_client = docker.from_env()
        self.sio = socketio.Client(reconnection=True, reconnection_delay=5)
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.sio.event
        def connect():
            print('[Agent] 已连接')
            self.send_heartbeat()
        
        @self.sio.event
        def disconnect():
            print('[Agent] 断开连接')
        
        @self.sio.on('docker:create')
        def on_create(data):
            result = self.handle_create(data)
            self.sio.emit('docker:create:response', result, namespace='/agent')
        
        @self.sio.on('docker:start')
        def on_start(data):
            result = self.handle_start(data)
            self.sio.emit('docker:start:response', result, namespace='/agent')
        
        @self.sio.on('docker:stop')
        def on_stop(data):
            result = self.handle_stop(data)
            self.sio.emit('docker:stop:response', result, namespace='/agent')
        
        @self.sio.on('docker:remove')
        def on_remove(data):
            result = self.handle_remove(data)
            self.sio.emit('docker:remove:response', result, namespace='/agent')
        
        @self.sio.on('docker:exec')
        def on_exec(data):
            result = self.handle_exec(data)
            self.sio.emit('docker:exec:response', result, namespace='/agent')
        
        @self.sio.on('docker:list')
        def on_list(data):
            result = self.handle_list(data)
            self.sio.emit('docker:list:response', result, namespace='/agent')
    
    def connect(self):
        self.sio.connect(self.config['serverUrl'], namespaces=['/agent'], auth={'token': self.config['agentToken'], 'serverName': self.config['serverName']})
        Thread(target=self.heartbeat_loop, daemon=True).start()
    
    def heartbeat_loop(self):
        time.sleep(1)
        while True:
            time.sleep(0.5)
            if self.sio.connected:
                self.send_heartbeat()
    
    def send_heartbeat(self):
        try:
            cpu = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            containers = self.docker_client.containers.list()
            cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count()
            cpu_model = 'Unknown'
            try:
                with open('/proc/cpuinfo') as f:
                    for line in f:
                        if 'model name' in line:
                            cpu_model = line.split(':')[1].strip()
                            break
            except: pass
            # 获取本机 IP
            server_ip = 'unknown'
            try:
                import socket
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                server_ip = s.getsockname()[0]
                s.close()
            except: pass
            self.sio.emit('agent:heartbeat', {'cpuUsage': cpu, 'memoryUsage': mem.percent, 'totalMemory': mem.total//(1024*1024), 'cpuCores': cpu_count, 'cpuModel': cpu_model, 'activeContainers': len(containers), 'serverIp': server_ip, 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')}, namespace='/agent')
        except Exception as e:
            print(f'[Agent] 心跳失败: {e}')
    
    def handle_create(self, data):
        try:
            try: self.docker_client.images.get(data['image'])
            except: self.docker_client.images.pull(data['image'])
            c = self.docker_client.containers.run(data['image'], name=data['name'], detach=True, tty=True, stdin_open=True, mem_limit=f"{data['memoryLimit']}m", nano_cpus=int(data['cpuLimit']*1e9), ports={'22/tcp': None, '5900/tcp': None, '8080/tcp': None}, publish_all_ports=True)
            c.reload()
            p = c.attrs['NetworkSettings']['Ports']
            return {'success': True, 'data': {'id': c.id, 'sshPort': int(p.get('22/tcp',[{}])[0].get('HostPort',0)) or None, 'vncPort': int(p.get('5900/tcp',[{}])[0].get('HostPort',0)) or None, 'idePort': int(p.get('8080/tcp',[{}])[0].get('HostPort',0)) or None}}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_start(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).start()
            return {'success': True}
        except Exception as e: return {'success': False, 'error': str(e)}
    
    def handle_stop(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).stop()
            return {'success': True}
        except Exception as e: return {'success': False, 'error': str(e)}
    
    def handle_remove(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).remove(force=True)
            return {'success': True}
        except Exception as e: return {'success': False, 'error': str(e)}
    
    def handle_exec(self, data):
        try:
            r = self.docker_client.containers.get(data['containerId']).exec_run(f"/bin/sh -c \\"{data['command']}\\"", stdout=True, stderr=True)
            return {'success': True, 'output': r.output.decode('utf-8', errors='ignore')}
        except Exception as e: return {'success': False, 'error': str(e)}
    
    def handle_list(self, data):
        try:
            cs = self.docker_client.containers.list(all=True)
            return {'success': True, 'data': {'containers': [{'id': c.id, 'name': c.name, 'image': c.image.tags[0] if c.image.tags else c.image.id[:12], 'status': c.status, 'created': c.attrs['Created'], 'ports': c.attrs['NetworkSettings']['Ports']} for c in cs]}}
        except Exception as e: return {'success': False, 'error': str(e)}
    
    def run(self):
        self.connect()
        print('[Agent] 已启动')
        self.sio.wait()

if __name__ == '__main__':
    agent = SparkLabAgent(os.getenv('CONFIG_PATH', '/etc/spark-lab-agent/config.json'))
    try: agent.run()
    except KeyboardInterrupt: print('\\n[Agent] 关闭')
`;
  }
}
