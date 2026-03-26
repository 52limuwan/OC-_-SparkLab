@echo off
chcp 65001 >nul
echo ==========================================
echo 课程注册功能测试脚本
echo ==========================================
echo.

set API_URL=http://localhost:3001

echo 1. 测试登录...
curl -s -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"student\",\"password\":\"student123\"}" ^
  -c cookies.txt > login.json

findstr "access_token" login.json >nul
if %errorlevel% equ 0 (
  echo [32m✓ 登录成功[0m
) else (
  echo [31m✗ 登录失败[0m
  type login.json
  exit /b 1
)

echo.
echo 2. 获取课程列表（注册前）...
curl -s -X GET "%API_URL%/courses" -b cookies.txt > courses_before.json
echo 课程信息:
type courses_before.json

echo.
echo 3. 注册课程...
echo 请手动测试：
echo   1. 打开浏览器访问 http://localhost:3000
echo   2. 使用 student/student123 登录
echo   3. 访问课程中心
echo   4. 点击"立即注册"按钮
echo   5. 检查按钮是否变为"进入学习"
echo.

echo 4. 获取课程列表（注册后）...
timeout /t 5 /nobreak >nul
curl -s -X GET "%API_URL%/courses" -b cookies.txt > courses_after.json
echo 课程信息:
type courses_after.json

echo.
echo 5. 清理...
del /f /q cookies.txt login.json courses_before.json courses_after.json 2>nul

echo.
echo ==========================================
echo 测试完成！请检查浏览器中的实际效果
echo ==========================================
pause
