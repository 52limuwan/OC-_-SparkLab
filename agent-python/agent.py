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
            print(f'[Agent] 收到 docker:create 请求')
            result = self.handle_create(data)
            self.sio.emit('docker:create:response', result, namespace='/agent')
            
        @self.sio.on('docker:start')
        def on_start(data):
            print(f'[Agent] 收到 docker:start 请求')
            result = self.handle_start(data)
            self.sio.emit('docker:start:response', result, namespace='/agent')
            
        @self.sio.on('docker:stop')
        def on_stop(data):
            print(f'[Agent] 收到 docker:stop 请求')
            result = self.handle_stop(data)
            self.sio.emit('docker:stop:response', result, namespace='/agent')
            
        @self.sio.on('docker:remove')
        def on_remove(data):
            print(f'[Agent] 收到 docker:remove 请求')
            result = self.handle_remove(data)
            self.sio.emit('docker:remove:response', result, namespace='/agent')
            
        @self.sio.on('docker:exec')
        def on_exec(data):
            print(f'[Agent] 收到 docker:exec 请求')
            result = self.handle_exec(data)
            self.sio.emit('docker:exec:response', result, namespace='/agent')
        
        @self.sio.on('docker:list')
        def on_list(data):
            print(f'[Agent] 收到 docker:list 请求, 数据: {data}')
            result = self.handle_list(data)
            containers_count = len(result.get("data", {}).get("containers", []) if result.get("success") else [])
            print(f'[Agent] 返回容器列表: {containers_count} 个容器')
            print(f'[Agent] 发送响应事件: docker:list:response')
            self.sio.emit('docker:list:response', result, namespace='/agent')
            
        @self.sio.on('docker:run')
        def on_run(data):
            print(f'[Agent] 收到 docker:run 请求')
            result = self.handle_run(data)
            self.sio.emit('docker:run:response', result, namespace='/agent')
            
        @self.sio.on('docker:exec_create')
        def on_exec_create(data):
            print(f'[Agent] 收到 docker:exec_create 请求')
            result = self.handle_exec_create(data)
            self.sio.emit('docker:exec_create:response', result, namespace='/agent')
            
        @self.sio.on('docker:exec_start')
        def on_exec_start(data):
            print(f'[Agent] 收到 docker:exec_start 请求')
            result = self.handle_exec_start(data)
            self.sio.emit('docker:exec_start:response', result, namespace='/agent')
    
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
            
            # 获取本机 IP 地址
            server_ip = 'unknown'
            try:
                import socket
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                server_ip = s.getsockname()[0]
                s.close()
            except:
                pass
            
            stats = {
                'cpuUsage': cpu_percent,
                'memoryUsage': mem.percent,
                'totalMemory': mem.total // (1024 * 1024),
                'cpuCores': cpu_count,
                'cpuModel': cpu_model,
                'activeContainers': len(containers),
                'serverIp': server_ip,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            print(f'[Agent] 发送心跳: CPU={cpu_percent:.1f}%, 内存={mem.percent:.1f}%, 核心={cpu_count}, 总内存={mem.total // (1024 * 1024)}MB, IP={server_ip}')
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
    
    def handle_list(self, data):
        try:
            # 获取所有容器（包括停止的）
            all_containers = self.docker_client.containers.list(all=True)
            containers_info = []
            
            for container in all_containers:
                containers_info.append({
                    'id': container.id,
                    'name': container.name,
                    'image': container.image.tags[0] if container.image.tags else container.image.id[:12],
                    'status': container.status,
                    'created': container.attrs['Created'],
                    'ports': container.attrs['NetworkSettings']['Ports'],
                })
            
            return {'success': True, 'data': {'containers': containers_info}}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def handle_run(self, data):
        try:
            print(f"[Agent] 使用完整 docker run 命令创建容器")
            import shlex
            
            # 解析命令
            command = data.get('command', '')
            print(f"[Agent] 执行命令: {command}")
            
            # 使用 subprocess 执行命令
            import subprocess
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"[Agent] 命令执行失败: {result.stderr}")
                return {'success': False, 'error': result.stderr}
            
            print(f"[Agent] 命令执行成功: {result.stdout}")
            
            # 获取最新创建的容器
            containers = self.docker_client.containers.list(all=True)
            if not containers:
                return {'success': False, 'error': '无法找到创建的容器'}
            
            # 按创建时间排序，取最新的
            containers.sort(key=lambda c: c.attrs['Created'], reverse=True)
            container = containers[0]
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
            print(f'[Agent] docker:run 失败: {e}')
            return {'success': False, 'error': str(e)}
    
    def handle_create(self, data):
        try:
            print(f"[Agent] 创建容器: {data['name']}")
            
            # 拉取镜像
            try:
                self.docker_client.images.get(data['image'])
            except docker.errors.ImageNotFound:
                print(f"[Agent] 拉取镜像: {data['image']}")
                self.docker_client.images.pull(data['image'])
            
            # 构建容器参数
            run_kwargs = {
                'image': data['image'],
                'name': data['name'],
                'detach': True,
                'tty': True,
                'stdin_open': True,
                'mem_limit': f"{data['memoryLimit']}m",
                'nano_cpus': int(data['cpuLimit'] * 1e9),
            }
            
            # 添加环境变量
            if 'environment' in data and data['environment']:
                import json
                env_dict = json.loads(data['environment'])
                run_kwargs['environment'] = [f"{k}={v}" for k, v in env_dict.items()]
            
            # 添加端口映射
            ports_config = {
                '22/tcp': None,
                '5900/tcp': None,
                '8080/tcp': None
            }
            if 'ports' in data and data['ports']:
                import json
                custom_ports = json.loads(data['ports'])
                ports_config.update(custom_ports)
            run_kwargs['ports'] = ports_config
            
            # 添加卷挂载
            if 'volumes' in data and data['volumes']:
                import json
                run_kwargs['volumes'] = json.loads(data['volumes'])
            
            # 添加重启策略
            if 'restartPolicy' in data and data['restartPolicy']:
                import json
                run_kwargs['restart_policy'] = json.loads(data['restartPolicy'])
            
            # 添加网络模式
            if 'networkMode' in data and data['networkMode']:
                run_kwargs['network_mode'] = data['networkMode']
            
            # 添加主机名
            if 'hostname' in data and data['hostname']:
                run_kwargs['hostname'] = data['hostname']
            
            # 添加工作目录
            if 'workingDir' in data and data['workingDir']:
                run_kwargs['working_dir'] = data['workingDir']
            
            # 添加标签
            if 'labels' in data and data['labels']:
                import json
                run_kwargs['labels'] = json.loads(data['labels'])
            
            # 添加启动命令
            if 'startupCommand' in data and data['startupCommand']:
                run_kwargs['command'] = data['startupCommand']
            
            # 创建并启动容器
            container = self.docker_client.containers.run(**run_kwargs)
            
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
    
    def handle_exec_create(self, data):
        try:
            print(f"[Agent] 创建 exec 实例: {data.get('command')}")
            container = self.docker_client.containers.get(data['containerId'])
            
            # 创建 exec 实例
            exec_instance = container.client.api.exec_create(
                container.id,
                cmd=data.get('command', '/bin/bash'),
                tty=data.get('tty', True),
                stdin=data.get('stdin', True),
                stdout=data.get('stdout', True),
                stderr=data.get('stderr', True)
            )
            
            return {
                'success': True,
                'data': {
                    'execId': exec_instance['Id']
                }
            }
        except Exception as e:
            print(f'[Agent] exec_create 失败: {e}')
            return {'success': False, 'error': str(e)}
    
    def handle_exec_start(self, data):
        try:
            print(f"[Agent] 启动 exec 实例: {data.get('execId')}")
            
            # 启动 exec 实例
            output = self.docker_client.api.exec_start(
                data['execId'],
                stream=data.get('stream', False),
                detach=data.get('detach', False),
                tty=data.get('tty', True)
            )
            
            if data.get('stream', False):
                # 流式输出，返回标识让前端处理
                return {
                    'success': True,
                    'data': {
                        'streaming': True
                    }
                }
            else:
                # 非流式输出，直接返回结果
                return {
                    'success': True,
                    'data': {
                        'output': output.decode('utf-8', errors='ignore')
                    }
                }
        except Exception as e:
            print(f'[Agent] exec_start 失败: {e}')
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
