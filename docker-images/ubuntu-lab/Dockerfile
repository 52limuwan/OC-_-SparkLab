FROM ubuntu:22.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV USER=labuser
ENV HOME=/home/$USER

# 安装基础工具
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    wget \
    vim \
    nano \
    git \
    sudo \
    net-tools \
    iputils-ping \
    htop \
    tree \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN useradd -m -s /bin/bash $USER && \
    echo "$USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 设置工作目录
WORKDIR $HOME

# 切换到非 root 用户
USER $USER

# 设置默认命令
CMD ["/bin/bash"]
