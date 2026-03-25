@echo off
chcp 65001 >nul
cls

echo ========================================
echo 🚀 星火实验室 - 启动中...
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 Node.js
    echo 请访问 https://nodejs.org 安装 Node.js 18+
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

REM 检查 Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  警告: 未安装 Docker
    echo 容器功能将无法使用
) else (
    echo ✅ Docker 已安装
    docker --version
)

echo.
echo ========================================
echo 📦 安装依赖...
echo ========================================
echo.

REM 后端依赖
echo 1️⃣  安装后端依赖...
cd backend
if not exist "node_modules" (
    call npm install
) else (
    echo    后端依赖已存在，跳过安装
)

REM 前端依赖
echo.
echo 2️⃣  安装前端依赖...
cd ..\frontend
if not exist "node_modules" (
    call npm install
) else (
    echo    前端依赖已存在，跳过安装
)

cd ..

echo.
echo ========================================
echo 🗄️  初始化数据库...
echo ========================================
echo.

cd backend

REM 检查环境变量
if not exist ".env" (
    echo    创建环境变量文件...
    copy .env.example .env >nul
    echo    ✅ .env 文件已创建
)

REM 检查数据库
if not exist "spark_lab.db" (
    echo    生成 Prisma Client...
    call npm run prisma:generate
    
    echo    运行数据库迁移...
    call npm run prisma:migrate
    
    echo    填充种子数据...
    call npm run prisma:seed
    
    echo    ✅ 数据库初始化完成
) else (
    echo    数据库已存在，跳过初始化
)

cd ..

REM 创建前端环境变量
if not exist "frontend\.env.local" (
    echo.
    echo    创建前端环境变量...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001 > frontend\.env.local
    echo    ✅ frontend\.env.local 已创建
)

echo.
echo ========================================
echo ✨ 准备完成！
echo ========================================
echo.
echo 🎯 启动服务...
echo.
echo 后端服务: http://localhost:3001
echo 前端服务: http://localhost:3000
echo.
echo 测试账户:
echo   管理员 - 用户名: admin    密码: admin123
echo   学生   - 用户名: student  密码: student123
echo.
echo ========================================
echo.

REM 启动后端
echo 🔧 启动后端服务...
start "Spark Lab Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 5 /nobreak >nul

REM 启动前端
echo 🎨 启动前端服务...
start "Spark Lab Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 🎉 星火实验室启动成功！
echo ========================================
echo.
echo 📱 访问地址: http://localhost:3000
echo.
echo 🛑 停止服务: 关闭对应的命令行窗口
echo.
echo ========================================
echo.

REM 打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo 按任意键退出...
pause >nul
