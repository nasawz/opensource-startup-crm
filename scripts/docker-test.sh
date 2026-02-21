#!/bin/bash

# ================================
# BottleCRM API + MCP Server - 本地 Docker 测试脚本
# 用于在本地构建和测试 Docker 镜像
# ================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

IMAGE_NAME="bottlecrm-api"
IMAGE_TAG=$(node -p "require('./package.json').version")
CONTAINER_NAME="bottlecrm-api-test"
TEST_PORT="${TEST_PORT:-3002}"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   BottleCRM API + MCP Server - 本地 Docker 测试               ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📌 镜像: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo -e "${CYAN}📌 容器: ${CONTAINER_NAME}${NC}"
echo -e "${CYAN}📌 端口: ${TEST_PORT}${NC}"
echo ""

# 1. 清理旧容器
echo -e "${YELLOW}🧹 Step 1: 清理旧容器...${NC}"
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# 2. 构建镜像
echo ""
echo -e "${YELLOW}📦 Step 2: 构建 Docker 镜像...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .

# 3. 启动容器
echo ""
echo -e "${YELLOW}🚀 Step 3: 启动容器...${NC}"

if [ -f .env ]; then
    echo "   使用 .env 文件中的环境变量"
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${TEST_PORT}:3002 \
        --env-file .env \
        -e NODE_ENV=production \
        -e PORT=3002 \
        ${IMAGE_NAME}:${IMAGE_TAG}
else
    echo -e "${RED}   ⚠️  未找到 .env 文件，容器可能无法正常工作${NC}"
    echo "   请确保设置了以下环境变量："
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${TEST_PORT}:3002 \
        -e NODE_ENV=production \
        -e PORT=3002 \
        ${IMAGE_NAME}:${IMAGE_TAG}
fi

# 4. 等待服务启动
echo ""
echo -e "${YELLOW}⏳ Step 4: 等待服务启动...${NC}"
sleep 5

# 5. 检查容器状态
echo ""
echo -e "${YELLOW}📊 Step 5: 检查容器状态...${NC}"
docker ps -f name=${CONTAINER_NAME}

# 6. 测试健康检查
echo ""
echo -e "${YELLOW}🏥 Step 6: 测试健康检查...${NC}"
sleep 2
HEALTH_CHECK=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/health || echo "000")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "   ${GREEN}✅ 健康检查通过${NC}"
    echo ""
    echo "   健康检查响应:"
    curl -s http://localhost:${TEST_PORT}/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:${TEST_PORT}/health
else
    echo -e "   ${RED}⚠️  健康检查失败 (HTTP $HEALTH_CHECK)${NC}"
    echo ""
    echo "📋 容器日志："
    docker logs ${CONTAINER_NAME}
    exit 1
fi

# 7. 测试 Swagger 文档
echo ""
echo -e "${YELLOW}📖 Step 7: 测试 Swagger 文档...${NC}"
SWAGGER_CHECK=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/api-docs/ || echo "000")
if [ "$SWAGGER_CHECK" = "200" ] || [ "$SWAGGER_CHECK" = "301" ]; then
    echo -e "   ${GREEN}✅ Swagger 文档访问正常${NC}"
else
    echo -e "   ${RED}⚠️  Swagger 文档访问失败 (HTTP $SWAGGER_CHECK)${NC}"
fi

# 8. 测试 MCP 信息端点
echo ""
echo -e "${YELLOW}🔌 Step 8: 测试 MCP 端点...${NC}"
MCP_CHECK=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${TEST_PORT}/mcp/info || echo "000")
if [ "$MCP_CHECK" = "200" ]; then
    echo -e "   ${GREEN}✅ MCP 信息端点正常${NC}"
    echo ""
    echo "   MCP 信息:"
    curl -s http://localhost:${TEST_PORT}/mcp/info | python3 -m json.tool 2>/dev/null || curl -s http://localhost:${TEST_PORT}/mcp/info
else
    echo -e "   ${YELLOW}⚠️  MCP 信息端点返回 (HTTP $MCP_CHECK)${NC}"
fi

echo ""
echo -e "${GREEN}✅ 测试完成！${NC}"
echo ""
echo -e "${CYAN}🌐 访问地址:${NC}"
echo "   • 健康检查:  http://localhost:${TEST_PORT}/health"
echo "   • Swagger:   http://localhost:${TEST_PORT}/api-docs"
echo "   • MCP 信息:  http://localhost:${TEST_PORT}/mcp/info"
echo "   • MCP HTTP:  http://localhost:${TEST_PORT}/mcp"
echo "   • MCP SSE:   http://localhost:${TEST_PORT}/mcp/sse"
echo ""
echo -e "${CYAN}📖 常用命令:${NC}"
echo "   查看日志: docker logs -f ${CONTAINER_NAME}"
echo "   停止容器: docker stop ${CONTAINER_NAME}"
echo "   删除容器: docker rm ${CONTAINER_NAME}"
echo "   进入容器: docker exec -it ${CONTAINER_NAME} sh"
echo ""
