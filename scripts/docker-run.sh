#!/bin/bash

# ================================
# BottleCRM API + MCP Server - Docker 运行脚本
# ================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

IMAGE_NAME="bottlecrm-api"
IMAGE_TAG="${1:-latest}"
CONTAINER_NAME="bottlecrm-api"
PORT="${2:-3002}"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   BottleCRM API + MCP Server - Docker 运行                    ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}⚠️ 发现已存在的容器: ${CONTAINER_NAME}${NC}"
    echo -e "停止并删除旧容器..."
    docker stop "${CONTAINER_NAME}" 2>/dev/null || true
    docker rm "${CONTAINER_NAME}" 2>/dev/null || true
fi

echo -e "${YELLOW}🚀 启动容器: ${CONTAINER_NAME}${NC}"
echo -e "   镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "   端口: ${PORT}:3002"
echo ""

if [ -f .env ]; then
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -p "${PORT}:3002" \
        --env-file .env \
        -e NODE_ENV=production \
        --restart unless-stopped \
        "${IMAGE_NAME}:${IMAGE_TAG}"
else
    echo -e "${YELLOW}⚠️ 未找到 .env 文件，使用默认环境变量${NC}"
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -p "${PORT}:3002" \
        -e NODE_ENV=production \
        --restart unless-stopped \
        "${IMAGE_NAME}:${IMAGE_TAG}"
fi

echo -e "等待服务启动..."
sleep 3

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo -e "${GREEN}✅ 容器启动成功!${NC}"
    echo ""
    echo -e "容器状态:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${YELLOW}服务地址:${NC}"
    echo "  • 健康检查:  http://localhost:${PORT}/health"
    echo "  • Swagger:   http://localhost:${PORT}/api-docs"
    echo "  • MCP HTTP:  http://localhost:${PORT}/mcp"
    echo "  • MCP SSE:   http://localhost:${PORT}/mcp/sse"
    echo ""
    echo -e "${YELLOW}查看日志:${NC}"
    echo "  docker logs -f ${CONTAINER_NAME}"
    echo ""
    echo -e "${YELLOW}停止容器:${NC}"
    echo "  docker stop ${CONTAINER_NAME}"
else
    echo -e "${RED}❌ 容器启动失败!${NC}"
    echo ""
    echo "查看日志:"
    docker logs "${CONTAINER_NAME}"
    exit 1
fi
