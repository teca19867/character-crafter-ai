#!/bin/bash

echo "启动Character Crafter AI (带BFL代理服务器)"
echo ""

echo "正在启动代理服务器..."
npm run server &
PROXY_PID=$!

echo "等待代理服务器启动..."
sleep 3

echo "正在启动前端应用..."
npm run dev &
DEV_PID=$!

echo ""
echo "两个服务都已启动！"
echo "前端应用: http://localhost:3000"
echo "代理服务器: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $PROXY_PID $DEV_PID; exit" INT
wait
