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

# 下载 Agent
cd $INSTALL_DIR

cat > agent.py <<'AGENT_EOF'
#!/usr/bin/env python3
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
            return self.handle_create(data)
            
        @self.sio.on('docker:start')
        def on_start(data):
            return self.handle_start(data)
            
        @self.sio.on('docker:stop')
        def on_stop(data):
            return self.handle_stop(data)
            
        @self.sio.on('docker:remove')
        def on_remove(data):
            return self.handle_remove(data)
            
        @self.sio.on('docker:exec')
        def on_exec(data):
            return self.handle_exec(data)
    
    def connect(self):
        print(f"[Agent] 连接到: {self.config['serverUrl']}")
        self.sio.connect(f"{self.config['serverUrl']}/agent", auth={'token': self.config['agentToken'], 'serverName': self.config['serverName']})
        Thread(target=self.heartbeat_loop, daemon=True).start()
        
    def heartbeat_loop(self):
        while True:
            time.sleep(30)
            if self.sio.connected:
                self.send_heartbeat()
    
    def send_heartbeat(self):
        try:
            cpu = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            containers = self.docker_client.containers.list()
            self.sio.emit('agent:heartbeat', {'cpuUsage': cpu, 'memoryUsage': mem.percent, 'totalMemory': mem.total // (1024*1024), 'activeContainers': len(containers), 'maxContainers': self.config['maxContainers'], 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')})
        except Exception as e:
            print(f'[Agent] 心跳失败: {e}')
    
    def handle_create(self, data):
        try:
            print(f"[Agent] 创建容器: {data['name']}")
            try:
                self.docker_client.images.get(data['image'])
            except:
                print(f"[Agent] 拉取镜像: {data['image']}")
                self.docker_client.images.pull(data['image'])
            container = self.docker_client.containers.run(data['image'], name=data['name'], detach=True, tty=True, stdin_open=True, mem_limit=f"{data['memoryLimit']}m", nano_cpus=int(data['cpuLimit']*1e9), ports={'22/tcp': None, '5900/tcp': None, '8080/tcp': None}, publish_all_ports=True)
            container.reload()
            ports = container.attrs['NetworkSettings']['Ports']
            return {'success': True, 'data': {'id': container.id, 'sshPort': int(ports.get('22/tcp',[{}])[0].get('HostPort',0)) or None, 'vncPort': int(ports.get('5900/tcp',[{}])[0].get('HostPort',0)) or None, 'idePort': int(ports.get('8080/tcp',[{}])[0].get('HostPort',0)) or None}}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_start(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).start()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_stop(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).stop()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_remove(self, data):
        try:
            self.docker_client.containers.get(data['containerId']).remove(force=True)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_exec(self, data):
        try:
            result = self.docker_client.containers.get(data['containerId']).exec_run(f"/bin/sh -c \"{data['command']}\"", stdout=True, stderr=True)
            return {'success': True, 'output': result.output.decode('utf-8', errors='ignore')}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def run(self):
        self.connect()
        print('[Agent] 已启动')
        self.sio.wait()

if __name__ == '__main__':
    agent = SparkLabAgent(os.getenv('CONFIG_PATH', '/etc/spark-lab-agent/config.json'))
    try:
        agent.run()
    except KeyboardInterrupt:
        print('\n[Agent] 关闭')
AGENT_EOF

chmod +x agent.py

# 安装依赖
echo "正在安装 Python 依赖..."
pip3 install python-socketio[client]==5.11.0 docker==7.0.0 psutil==5.9.8 -i https://pypi.tuna.tsinghua.edu.cn/simple

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

# 创建 systemd 服务
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
echo "查看状态: systemctl status spark-lab-agent"
echo "查看日志: journalctl -u spark-lab-agent -f"
echo ""

systemctl status spark-lab-agent --no-pager
