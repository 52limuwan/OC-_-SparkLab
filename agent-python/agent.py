#!/usr/bin/env python3
"""
Spark Lab Agent - Python 版本
轻量级服务器代理，支持 Python 3.6+
"""

import json
import os
import sys
import time
import subprocess
import socketio
import docker
import psutil
from threading import Thread

class SparkLabAgent:
    def __init__(self, config_path):
        self.config = self.load_config(config_path)
        self.docker_client = docker.from_env()
        self.sio = socketio.Client(reconnection=True, reconnection_delay=5)
        self.setup_handlers()
        
    def load_config(self, config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    
    def setup_handlers(self):
        @self.sio.event
        def connect():
            print('[Agent] 已连接到中心服务器')
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
        self.sio.connect(
            self.config['serverUrl'],
            namespaces=['/agent'],
            auth={
                'token': self.config['agentToken'],
                'serverName': self.config['serverName']
            }
        )
        
        # 启动心跳线程
        Thread(target=self.heartbeat_loop, daemon=True).start()
        
    def heartbeat_loop(self):
        # 等待连接建立
        time.sleep(1)
        # 立即发送第一次心跳
        if self.sio.connected:
            self.send_heartbeat()
        # 然后每 0.5 秒发送一次
        while True:
            time.sleep(0.5)
            if self.sio.connected:
                self.send_heartbeat()
    
    def send_heartbeat(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            containers = self.docker_client.containers.list()
            
            # 获取 CPU 信息
            cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count()
            cpu_model = 'Unknown'
            try:
                with open('/proc/cpuinfo', 'r') as f:
                    for line in f:
                        if 'model name' in line:
                            cpu_model = line.split(':')[1].strip()
                            break
            except:
                pass
            
            stats = {
                'cpuUsage': cpu_percent,
                'memoryUsage': mem.percent,
                'totalMemory': mem.total // (1024 * 1024),
                'cpuCores': cpu_count,
                'cpuModel': cpu_model,
                'activeContainers': len(containers),
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            print(f'[Agent] 发送心跳: CPU={cpu_percent:.1f}%, 内存={mem.percent:.1f}%, 核心={cpu_count}, 总内存={mem.total // (1024 * 1024)}MB')
            self.sio.emit('agent:heartbeat', stats, namespace='/agent')
        except Exception as e:
            print(f'[Agent] 心跳失败: {e}')
    
    def handle_create(self, data):
        try:
            print(f"[Agent] 创建容器: {data['name']}")
            
            # 拉取镜像
            try:
                self.docker_client.images.get(data['image'])
            except docker.errors.ImageNotFound:
                print(f"[Agent] 拉取镜像: {data['image']}")
                self.docker_client.images.pull(data['image'])
            
            # 创建容器
            container = self.docker_client.containers.run(
                data['image'],
                name=data['name'],
                detach=True,
                tty=True,
                stdin_open=True,
                mem_limit=f"{data['memoryLimit']}m",
                nano_cpus=int(data['cpuLimit'] * 1e9),
                ports={
                    '22/tcp': None,
                    '5900/tcp': None,
                    '8080/tcp': None
                },
                publish_all_ports=True
            )
            
            # 获取端口映射
            container.reload()
            ports = container.attrs['NetworkSettings']['Ports']
            
            return {
                'success': True,
                'data': {
                    'id': container.id,
                    'sshPort': int(ports.get('22/tcp', [{}])[0].get('HostPort', 0)) or None,
                    'vncPort': int(ports.get('5900/tcp', [{}])[0].get('HostPort', 0)) or None,
                    'idePort': int(ports.get('8080/tcp', [{}])[0].get('HostPort', 0)) or None
                }
            }
        except Exception as e:
            print(f'[Agent] 创建失败: {e}')
            return {'success': False, 'error': str(e)}
    
    def handle_start(self, data):
        try:
            container = self.docker_client.containers.get(data['containerId'])
            container.start()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_stop(self, data):
        try:
            container = self.docker_client.containers.get(data['containerId'])
            container.stop()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_remove(self, data):
        try:
            container = self.docker_client.containers.get(data['containerId'])
            container.remove(force=True)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_exec(self, data):
        try:
            container = self.docker_client.containers.get(data['containerId'])
            cmd = '/bin/sh -c "' + data['command'] + '"'
            result = container.exec_run(cmd, stdout=True, stderr=True)
            return {
                'success': True,
                'output': result.output.decode('utf-8', errors='ignore')
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def run(self):
        self.connect()
        print('[Agent] 已启动，按 Ctrl+C 退出')
        self.sio.wait()

if __name__ == '__main__':
    config_path = os.getenv('CONFIG_PATH', '/etc/spark-lab-agent/config.json')
    
    if not os.path.exists(config_path):
        print(f'错误: 配置文件不存在: {config_path}')
        sys.exit(1)
    
    agent = SparkLabAgent(config_path)
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print('\n[Agent] 正在关闭...')
        sys.exit(0)
