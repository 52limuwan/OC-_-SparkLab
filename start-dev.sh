#!/bin/bash

echo "🚀 Starting Docker Lab Platform (Development Mode)"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# 构建实训镜像
echo "📦 Building lab container image..."
cd docker-images/ubuntu-lab
chmod +x build.sh
./build.sh
cd ../..

# 启动数据库
echo ""
echo "🗄️  Starting PostgreSQL..."
docker run -d \
    --name docker-lab-db \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=docker_lab \
    -p 5432:5432 \
    postgres:15

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd backend && npm install && npm run start:dev"
echo "2. cd frontend && npm install && npm run dev"
echo ""
echo "Access the platform at: http://localhost:3000"
