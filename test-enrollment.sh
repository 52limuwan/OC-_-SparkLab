#!/bin/bash

echo "=========================================="
echo "课程注册功能测试脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API 基础 URL
API_URL="http://localhost:3001"

echo "1. 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student","password":"student123"}' \
  -c cookies.txt)

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✓ 登录成功${NC}"
else
  echo -e "${RED}✗ 登录失败${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "2. 获取课程列表（注册前）..."
COURSES_BEFORE=$(curl -s -X GET "$API_URL/courses" -b cookies.txt)
echo "$COURSES_BEFORE" | jq '.[0] | {id, title, isEnrolled}'

echo ""
echo "3. 注册第一个课程..."
COURSE_ID=$(echo "$COURSES_BEFORE" | jq -r '.[0].id')
echo "课程 ID: $COURSE_ID"

ENROLL_RESPONSE=$(curl -s -X POST "$API_URL/courses/$COURSE_ID/enroll" -b cookies.txt)
if echo "$ENROLL_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✓ 注册成功${NC}"
  echo "$ENROLL_RESPONSE" | jq '.'
else
  echo -e "${RED}✗ 注册失败${NC}"
  echo "响应: $ENROLL_RESPONSE"
  exit 1
fi

echo ""
echo "4. 获取课程列表（注册后）..."
COURSES_AFTER=$(curl -s -X GET "$API_URL/courses" -b cookies.txt)
echo "$COURSES_AFTER" | jq '.[0] | {id, title, isEnrolled}'

echo ""
echo "5. 验证结果..."
IS_ENROLLED=$(echo "$COURSES_AFTER" | jq -r '.[0].isEnrolled')
if [ "$IS_ENROLLED" = "true" ]; then
  echo -e "${GREEN}✓ 测试通过！课程已成功注册，isEnrolled = true${NC}"
else
  echo -e "${RED}✗ 测试失败！isEnrolled = $IS_ENROLLED${NC}"
  exit 1
fi

echo ""
echo "6. 清理..."
rm -f cookies.txt

echo ""
echo "=========================================="
echo -e "${GREEN}所有测试通过！${NC}"
echo "=========================================="
