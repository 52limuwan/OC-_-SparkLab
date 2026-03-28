package handler

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"bigdata_zhoc/backend-go/internal/model"

	"github.com/gin-gonic/gin"
)

type agentAuthReq struct {
	Token      string  `json:"token"`
	ServerName string  `json:"serverName"`
	ServerIP   *string `json:"serverIp"`
	CPUCores   *int    `json:"cpuCores"`
	TotalMemory *int   `json:"totalMemory"`
	CPUModel   *string `json:"cpuModel"`
}

type agentHeartbeatReq struct {
	Token            string   `json:"token"`
	ServerName       string   `json:"serverName"`
	CPUUsage         *float64 `json:"cpuUsage"`
	MemoryUsage      *float64 `json:"memoryUsage"`
	ActiveContainers *int     `json:"activeContainers"`
	ServerIP         *string  `json:"serverIp"`
	CPUCores         *int     `json:"cpuCores"`
	TotalMemory      *int     `json:"totalMemory"`
	CPUModel         *string  `json:"cpuModel"`
}

func (h *Handler) findServerByAgentToken(serverName, token string) (*model.Server, bool) {
	var server model.Server
	err := h.db.Where("name = ? AND password = ?", serverName, token).First(&server).Error
	if err != nil {
		return nil, false
	}
	return &server, true
}

func normalizeAgentIP(ip *string) *string {
	if ip == nil {
		return nil
	}
	v := strings.TrimSpace(*ip)
	if v == "" || strings.EqualFold(v, "unknown") {
		return nil
	}
	return &v
}

func (h *Handler) AgentRegister(c *gin.Context) {
	var req agentAuthReq
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Token) == "" || strings.TrimSpace(req.ServerName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "token and serverName are required"})
		return
	}

	server, ok := h.findServerByAgentToken(req.ServerName, req.Token)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token or server name"})
		return
	}

	updates := map[string]any{
		"status":      "online",
		"lastCheckAt": time.Now(),
		"updatedAt":   time.Now(),
	}
	if ip := normalizeAgentIP(req.ServerIP); ip != nil {
		updates["host"] = *ip
	}
	if req.CPUCores != nil && *req.CPUCores > 0 {
		updates["cpuCores"] = *req.CPUCores
	}
	if req.TotalMemory != nil && *req.TotalMemory > 0 {
		updates["totalMemory"] = *req.TotalMemory
	}
	if req.CPUModel != nil && strings.TrimSpace(*req.CPUModel) != "" {
		updates["cpuModel"] = strings.TrimSpace(*req.CPUModel)
	}

	if err := h.db.Model(&model.Server{}).Where("id = ?", server.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Register agent failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Agent registered", "serverId": server.ID})
}

func (h *Handler) AgentHeartbeat(c *gin.Context) {
	var req agentHeartbeatReq
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Token) == "" || strings.TrimSpace(req.ServerName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "token and serverName are required"})
		return
	}

	server, ok := h.findServerByAgentToken(req.ServerName, req.Token)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token or server name"})
		return
	}

	updates := map[string]any{
		"status":      "online",
		"lastCheckAt": time.Now(),
		"updatedAt":   time.Now(),
	}
	if req.CPUUsage != nil {
		updates["cpuUsage"] = *req.CPUUsage
	}
	if req.MemoryUsage != nil {
		updates["memoryUsage"] = *req.MemoryUsage
	}
	if req.ActiveContainers != nil {
		updates["activeContainers"] = *req.ActiveContainers
	}
	if req.CPUCores != nil && *req.CPUCores > 0 {
		updates["cpuCores"] = *req.CPUCores
	}
	if req.TotalMemory != nil && *req.TotalMemory > 0 {
		updates["totalMemory"] = *req.TotalMemory
	}
	if req.CPUModel != nil && strings.TrimSpace(*req.CPUModel) != "" {
		updates["cpuModel"] = strings.TrimSpace(*req.CPUModel)
	}
	if ip := normalizeAgentIP(req.ServerIP); ip != nil {
		updates["host"] = *ip
	}

	if err := h.db.Model(&model.Server{}).Where("id = ?", server.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Heartbeat update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) AgentInstallScript(c *gin.Context) {
	script := `#!/bin/bash

set -e

echo "================================"
echo "Spark Lab Agent 安装程序 (Python)"
echo "================================"

if [ $# -lt 3 ]; then
    echo "错误: 缺少参数"
    echo "用法: bash install.sh <SERVER_URL> <TOKEN> <SERVER_NAME>"
    exit 1
fi

SERVER_URL=$1
AGENT_TOKEN=$2
SERVER_NAME=$3
MAX_CONTAINERS=${4:-10}

echo "服务器地址: $SERVER_URL"
echo "服务器名称: $SERVER_NAME"

if [ "$EUID" -ne 0 ]; then
    echo "错误: 请使用 root 权限运行"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "安装: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "正在安装 Python 3..."
    if [ -f /etc/debian_version ]; then
        apt-get update
        apt-get install -y python3 python3-pip python3-dev gcc
    elif [ -f /etc/redhat-release ]; then
        yum install -y python3 python3-pip python3-devel gcc
    fi
fi

INSTALL_DIR="/opt/spark-lab-agent"
CONFIG_DIR="/etc/spark-lab-agent"
mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR

echo "下载 Agent 程序..."
curl -fsSL "$SERVER_URL/agent/agent-http.py" -o "$INSTALL_DIR/agent.py"
chmod +x "$INSTALL_DIR/agent.py"

echo "安装 Python 依赖..."
pip3 install python-socketio[client]==5.7.0 docker==5.0.3 psutil==5.9.0 -i https://pypi.tuna.tsinghua.edu.cn/simple

cat > "$CONFIG_DIR/config.json" <<EOF
{
  "serverUrl": "$SERVER_URL",
  "agentToken": "$AGENT_TOKEN",
  "serverName": "$SERVER_NAME",
  "maxContainers": $MAX_CONTAINERS
}
EOF

chmod 600 "$CONFIG_DIR/config.json"

echo "配置 Docker TCP 端口..."
cat > /etc/docker/daemon.json <<EOF
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}
EOF

mkdir -p /etc/systemd/system/docker.service.d
cat > /etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd
EOF

systemctl daemon-reload
systemctl restart docker

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

systemctl daemon-reload
systemctl enable spark-lab-agent
systemctl start spark-lab-agent

echo ""
echo "================================"
echo "✓ 安装完成！"
echo "================================"
echo "查看日志: journalctl -u spark-lab-agent -f"
`

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.String(http.StatusOK, script)
}

func (h *Handler) AgentHTTPPythonFile(c *gin.Context) {
	script := `#!/usr/bin/env python3
import json
import os
import sys
import time
import requests

try:
	import psutil
except Exception:
	psutil = None

try:
	import docker
except Exception:
	docker = None


class SparkLabHTTPAgent:
	def __init__(self, config_path):
		with open(config_path, 'r', encoding='utf-8') as f:
			self.config = json.load(f)
		self.server_url = self.config['serverUrl'].rstrip('/')
		self.token = self.config['agentToken']
		self.server_name = self.config['serverName']
		self.session = requests.Session()
		self.docker_client = None
		if docker is not None:
			try:
				self.docker_client = docker.from_env()
			except Exception:
				self.docker_client = None

	def get_ip(self):
		try:
			import socket
			s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
			s.connect(("8.8.8.8", 80))
			ip = s.getsockname()[0]
			s.close()
			return ip
		except Exception:
			return None

	def collect_stats(self):
		cpu_usage = 0.0
		memory_usage = 0.0
		total_memory = 0
		cpu_cores = 0
		cpu_model = "Unknown"
		active_containers = 0

		if psutil is not None:
			try:
				cpu_usage = float(psutil.cpu_percent(interval=0.5))
			except Exception:
				pass
			try:
				memory_usage = float(psutil.virtual_memory().percent)
				total_memory = int(psutil.virtual_memory().total // (1024 * 1024))
			except Exception:
				pass
			try:
				cpu_cores = int(psutil.cpu_count(logical=False) or psutil.cpu_count() or 0)
			except Exception:
				pass

		try:
			with open('/proc/cpuinfo', 'r', encoding='utf-8', errors='ignore') as f:
				for line in f:
					if 'model name' in line:
						cpu_model = line.split(':', 1)[1].strip()
						break
		except Exception:
			pass

		if self.docker_client is not None:
			try:
				active_containers = len(self.docker_client.containers.list())
			except Exception:
				pass

		return {
			'cpuUsage': cpu_usage,
			'memoryUsage': memory_usage,
			'totalMemory': total_memory,
			'cpuCores': cpu_cores,
			'cpuModel': cpu_model,
			'activeContainers': active_containers,
			'serverIp': self.get_ip(),
		}

	def post_json(self, path, payload):
		url = self.server_url + path
		r = self.session.post(url, json=payload, timeout=10)
		if r.status_code >= 400:
			raise RuntimeError(f"HTTP {r.status_code}: {r.text}")
		return r.json() if r.text else {}

	def register(self):
		payload = {
			'token': self.token,
			'serverName': self.server_name,
			**self.collect_stats(),
		}
		self.post_json('/agent/register', payload)

	def heartbeat(self):
		payload = {
			'token': self.token,
			'serverName': self.server_name,
			**self.collect_stats(),
		}
		self.post_json('/agent/heartbeat', payload)

	def run(self):
		print('[Agent] HTTP Agent started')
		while True:
			try:
				self.register()
				print('[Agent] registered')
				break
			except Exception as e:
				print(f'[Agent] register failed: {e}')
				time.sleep(5)

		while True:
			try:
				self.heartbeat()
				time.sleep(2)
			except Exception as e:
				print(f'[Agent] heartbeat failed: {e}')
				time.sleep(5)


if __name__ == '__main__':
	config_path = os.getenv('CONFIG_PATH', '/etc/spark-lab-agent/config.json')
	if not os.path.exists(config_path):
		print(f'Config not found: {config_path}')
		sys.exit(1)
	agent = SparkLabHTTPAgent(config_path)
	agent.run()
`

	c.Header("Content-Type", "text/x-python; charset=utf-8")
	c.String(http.StatusOK, script)
}

func (h *Handler) AgentPythonFile(c *gin.Context) {
	paths := []string{
		"../agent-python/agent.py",
		"./agent-python/agent.py",
	}

	var content []byte
	var err error
	for _, p := range paths {
		content, err = os.ReadFile(p)
		if err == nil {
			c.Header("Content-Type", "text/x-python; charset=utf-8")
			c.String(http.StatusOK, string(content))
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"message": fmt.Sprintf("agent.py not found: %v", err)})
}
