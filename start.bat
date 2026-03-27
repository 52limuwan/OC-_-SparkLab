@echo off
chcp 65001 >nul
cls

echo Spark Lab - Starting...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not installed
    echo Please visit https://nodejs.org to install Node.js 18+
    pause
    exit /b 1
)

echo Node.js installed:
node --version

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Docker not installed - container features will be unavailable
) else (
    echo Docker installed:
    docker --version
)

REM Check Go (optional, used by docker-go bridge)
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Go not installed - docker-go bridge will not start
) else (
    echo Go installed:
    go version
)

echo.
echo Installing dependencies...
echo.

REM Backend dependencies
echo [1/2] Installing backend dependencies...
cd backend
if not exist "node_modules" (
    call npm install
) else (
    echo Backend dependencies already installed, skipping
)

REM Frontend dependencies
echo.
echo [2/2] Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    call npm install
) else (
    echo Frontend dependencies already installed, skipping
)

cd ..

echo.
echo Initializing database...
echo.

cd backend

REM Check environment variables
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env >nul
    echo .env file created
)

REM Check database
if not exist "prisma\spark_lab.db" (
    echo Generating Prisma Client...
    call npm run prisma:generate
    
    echo Running database migrations...
    call npm run prisma:migrate
    
    echo Seeding database...
    call npm run prisma:seed
    
    echo Database initialized
) else (
    echo Database already exists, skipping initialization
)

cd ..

REM Create frontend environment variables
if not exist "frontend\.env.local" (
    echo.
    echo Creating frontend .env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001 > frontend\.env.local
    echo frontend\.env.local created
)

echo.
echo Setup complete!
echo.
echo Starting services...
echo   Backend: http://localhost:3001
echo   Frontend: http://localhost:3000
echo.
echo Test accounts:
echo   Admin: admin / admin123
echo   Student: student / student123
echo.

REM Start backend
echo Starting backend service...
start "Spark Lab Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 5 /nobreak >nul

REM Start docker-go bridge (optional)
where go >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting docker-go bridge...
    start "Spark Lab Docker-Go" cmd /k "cd docker-go && set DOCKER_GO_ADDR=127.0.0.1:8085 && go run ."
    timeout /t 2 /nobreak >nul
)

REM Start frontend
echo Starting frontend service...
start "Spark Lab Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo Spark Lab started successfully!
echo Visit: http://localhost:3000
echo.
echo To stop: Close the terminal windows
echo.

REM Open browser
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Press any key to exit...
pause >nul
