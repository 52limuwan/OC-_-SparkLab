-- 示例实验数据

-- 实验 1: Linux 基础命令
INSERT INTO labs (id, title, description, content, difficulty, time_limit) VALUES (
  gen_random_uuid(),
  'Linux 基础命令实验',
  '掌握 Linux 基础命令的使用',
  '# 实验目标

掌握 Linux 基础命令的使用

## 任务 1: 文件操作

1. 创建一个名为 `workspace` 的目录
2. 进入该目录
3. 创建一个名为 `hello.txt` 的文件
4. 向文件中写入 "Hello Docker Lab"

```bash
mkdir workspace
cd workspace
echo "Hello Docker Lab" > hello.txt
cat hello.txt
```

## 任务 2: 查看系统信息

使用以下命令查看系统信息：

- `uname -a` - 查看系统信息
- `whoami` - 查看当前用户
- `pwd` - 查看当前目录
- `ls -la` - 查看文件列表

## 任务 3: 进程管理

1. 查看当前运行的进程
2. 使用 `top` 命令查看系统资源

> 提示：按 `q` 退出 top 命令

## 完成标准

- 成功创建文件并写入内容
- 能够查看系统信息
- 理解基本的 Linux 命令',
  'beginner',
  60
);

-- 实验 2: Docker 基础
INSERT INTO labs (id, title, description, content, difficulty, time_limit) VALUES (
  gen_random_uuid(),
  'Docker 容器基础',
  '学习 Docker 容器的基本操作',
  '# Docker 容器基础

## 实验目标

理解 Docker 容器的基本概念和操作

## 任务 1: 查看 Docker 信息

```bash
docker --version
docker info
```

## 任务 2: 镜像操作

```bash
# 查看本地镜像
docker images

# 搜索镜像
docker search ubuntu

# 拉取镜像
docker pull ubuntu:22.04
```

## 任务 3: 容器操作

```bash
# 运行容器
docker run -it ubuntu:22.04 /bin/bash

# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 停止容器
docker stop <container-id>

# 删除容器
docker rm <container-id>
```

## 思考题

1. 容器和虚拟机有什么区别？
2. Docker 镜像的分层结构是什么？
3. 如何持久化容器中的数据？',
  'intermediate',
  90
);

-- 实验 3: Python 编程
INSERT INTO labs (id, title, description, content, difficulty, time_limit) VALUES (
  gen_random_uuid(),
  'Python 基础编程',
  '学习 Python 基础语法和编程',
  '# Python 基础编程

## 实验目标

掌握 Python 基础语法

## 任务 1: Hello World

创建 `hello.py` 文件：

```python
print("Hello, Docker Lab!")
```

运行：
```bash
python3 hello.py
```

## 任务 2: 变量和数据类型

```python
# 数字
age = 25
price = 19.99

# 字符串
name = "Alice"
message = f"Hello, {name}!"

# 列表
fruits = ["apple", "banana", "orange"]

# 字典
person = {
    "name": "Bob",
    "age": 30,
    "city": "Beijing"
}

print(message)
print(fruits[0])
print(person["name"])
```

## 任务 3: 函数

```python
def greet(name):
    return f"Hello, {name}!"

def add(a, b):
    return a + b

print(greet("World"))
print(add(10, 20))
```

## 挑战任务

编写一个函数，计算列表中所有数字的和：

```python
def sum_list(numbers):
    # 你的代码
    pass

result = sum_list([1, 2, 3, 4, 5])
print(result)  # 应该输出 15
```',
  'beginner',
  120
);

-- 实验 4: Git 版本控制
INSERT INTO labs (id, title, description, content, difficulty, time_limit) VALUES (
  gen_random_uuid(),
  'Git 版本控制基础',
  '学习 Git 的基本使用',
  '# Git 版本控制基础

## 实验目标

掌握 Git 的基本操作

## 任务 1: 配置 Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 任务 2: 创建仓库

```bash
mkdir my-project
cd my-project
git init
```

## 任务 3: 基本操作

```bash
# 创建文件
echo "# My Project" > README.md

# 查看状态
git status

# 添加到暂存区
git add README.md

# 提交
git commit -m "Initial commit"

# 查看历史
git log
```

## 任务 4: 分支操作

```bash
# 创建分支
git branch feature

# 切换分支
git checkout feature

# 或者一步完成
git checkout -b feature

# 查看分支
git branch

# 合并分支
git checkout main
git merge feature
```

## 实践练习

1. 创建一个新文件 `app.py`
2. 提交到 Git
3. 创建一个新分支 `dev`
4. 在 `dev` 分支修改文件
5. 合并回 `main` 分支',
  'intermediate',
  90
);

-- 实验 5: Web 服务器
INSERT INTO labs (id, title, description, content, difficulty, time_limit) VALUES (
  gen_random_uuid(),
  '搭建简单的 Web 服务器',
  '使用 Python 搭建 HTTP 服务器',
  '# 搭建简单的 Web 服务器

## 实验目标

使用 Python 搭建一个简单的 HTTP 服务器

## 任务 1: 使用内置服务器

```bash
# 创建 HTML 文件
cat > index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>My Web Server</title>
</head>
<body>
    <h1>Hello from Docker Lab!</h1>
    <p>This is a simple web server.</p>
</body>
</html>
EOF

# 启动服务器
python3 -m http.server 8000
```

## 任务 2: 使用 Flask

安装 Flask：
```bash
pip3 install flask
```

创建 `app.py`：
```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "<h1>Hello from Flask!</h1>"

@app.route("/api/data")
def get_data():
    return {"message": "Hello", "status": "success"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

运行：
```bash
python3 app.py
```

## 任务 3: 测试 API

```bash
# 使用 curl 测试
curl http://localhost:5000/
curl http://localhost:5000/api/data
```

## 扩展任务

1. 添加更多路由
2. 实现 POST 请求处理
3. 添加静态文件服务
4. 实现简单的 RESTful API',
  'advanced',
  120
);
