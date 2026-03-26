# 服务器管理改进完成

## 已实现的功能

### 1. 自动获取硬件配置
- Agent 自动检测并上报 CPU 核心数、内存大小
- Agent 读取 `/proc/cpuinfo` 获取 CPU 型号
- 首次心跳时自动更新服务器硬件信息

### 2. 动态容器统计
- 移除了"最大容器数"的限制概念
- 容器数显示为实际运行的容器数量
- 通过 Agent 实时统计 Docker 容器

### 3. 简化服务器添加流程
- 只需输入服务器名称即可创建
- 硬件配置在 Agent 连接后自动获取
- 提示用户配置将自动获取

### 4. CPU 型号显示
- 鼠标悬停在"资源配置"卡片上显示 CPU 型号
- 使用 Tooltip 样式展示详细信息
- 与整体设计风格保持一致

### 5. 优化 Token 提示样式
- 移除了黄色警告背景和 emoji
- 使用统一的 surface-container 样式
- 边框使用 outline-variant 保持一致性

## 数据库变更

### 新增字段
- `cpuModel` (String, 可选): 存储 CPU 型号信息

### 字段说明
- `cpuCores`: 由 Agent 自动更新
- `totalMemory`: 由 Agent 自动更新
- `activeContainers`: 实时统计，不再有最大值限制
- `maxContainers`: 保留字段但不再在前端显示

## Agent 更新

### 心跳数据增强
```python
{
  'cpuUsage': float,        # CPU 使用率
  'memoryUsage': float,     # 内存使用率
  'totalMemory': int,       # 总内存 MB
  'cpuCores': int,          # CPU 核心数
  'cpuModel': str,          # CPU 型号
  'activeContainers': int,  # 活跃容器数
  'timestamp': str          # 时间戳
}
```

### CPU 信息获取
- 使用 `psutil.cpu_count(logical=False)` 获取物理核心数
- 读取 `/proc/cpuinfo` 获取 CPU 型号
- 兼容性处理：如果获取失败显示 "Unknown"

## 前端改进

### 服务器卡片
- 容器数：只显示当前数量，不显示最大值
- CPU 使用率：实时显示
- 内存使用率：实时显示
- 资源配置：显示核心数和内存，悬停显示 CPU 型号

### 添加服务器表单
- 只需填写服务器名称
- 添加说明文字：配置将自动获取
- 简化用户操作流程

### Token 显示模态框
- 使用 `bg-surface-container` 替代黄色背景
- 使用 `border-outline-variant/20` 统一边框样式
- 移除 emoji，使用纯文本提示

## 使用说明

### 添加新服务器
1. 点击"添加服务器"按钮
2. 输入服务器名称（如：实验服务器1）
3. 点击"创建"
4. 复制显示的安装命令
5. 在远程服务器上执行安装命令
6. Agent 连接后自动获取硬件配置

### 查看服务器信息
- 服务器名称和状态
- 实时 CPU 和内存使用率
- 当前运行的容器数量
- 硬件配置（核心数/内存）
- 鼠标悬停查看 CPU 型号

## 技术细节

### 数据流
1. Agent 每 30 秒发送心跳
2. 心跳包含系统信息和容器统计
3. 后端更新数据库记录
4. 前端定期刷新显示

### 兼容性
- 支持 Python 3.6+
- 兼容 CentOS 7 及更高版本
- 自动处理 CPU 信息获取失败的情况

### 性能优化
- CPU 使用率采样间隔 1 秒
- 心跳间隔 30 秒
- 容器列表只获取运行中的容器
