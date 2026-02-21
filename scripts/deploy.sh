#!/bin/bash

# ================================
# BottleCRM API + MCP Server - 部署脚本
# 用于将 Docker 镜像传输到远程服务器（不通过 Docker Hub）
# ================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

IMAGE_NAME="bottlecrm-api"
IMAGE_TAG=$(node -p "require('./package.json').version")
REMOTE_HOST="${REMOTE_HOST:-root@1.15.149.171}"
REMOTE_DIR="${REMOTE_DIR:-/opt/bottlecrm}"
REMOTE_PORT="${REMOTE_PORT:-3002}"
TAR_FILE="bottlecrm-api.tar"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   BottleCRM API + MCP Server - 部署脚本                       ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📌 镜像: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo -e "${CYAN}📌 远程主机: ${REMOTE_HOST}${NC}"
echo -e "${CYAN}📌 远程目录: ${REMOTE_DIR}${NC}"
echo -e "${CYAN}📌 服务端口: ${REMOTE_PORT}${NC}"
echo ""

# 1. 构建镜像（为 linux/amd64 平台）
echo -e "${YELLOW}📦 Step 1: 构建 Docker 镜像 (linux/amd64)...${NC}"

if docker buildx version &>/dev/null; then
    echo "   使用 buildx 构建..."
    docker buildx build --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile --load . || {
        echo -e "   ${YELLOW}⚠️  buildx 构建失败，尝试使用普通 docker build...${NC}"
        docker build --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .
    }
else
    echo "   使用普通 docker build..."
    docker build --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .
fi

# 2. 导出镜像为 tar 文件
echo ""
echo -e "${YELLOW}💾 Step 2: 导出镜像为 tar 文件...${NC}"
docker save -o ${TAR_FILE} ${IMAGE_NAME}:${IMAGE_TAG}
echo "   镜像大小: $(du -h ${TAR_FILE} | cut -f1)"

# 3. 压缩
echo ""
echo -e "${YELLOW}🗜️  Step 3: 压缩镜像文件...${NC}"
gzip -f ${TAR_FILE}
echo "   压缩后大小: $(du -h ${TAR_FILE}.gz | cut -f1)"

# 4. 传输到远程服务器
echo ""
echo -e "${YELLOW}📤 Step 4: 传输到远程服务器 ${REMOTE_HOST}...${NC}"
ssh ${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"
scp ${TAR_FILE}.gz ${REMOTE_HOST}:${REMOTE_DIR}/

# 5. 传输 docker-compose.prod.yml
echo ""
echo -e "${YELLOW}📄 Step 5: 传输 docker-compose.prod.yml...${NC}"
sed -e "s/\${IMAGE_TAG:-latest}/${IMAGE_TAG}/g" \
    -e "s/\${REMOTE_PORT:-3002}/${REMOTE_PORT}/g" \
    docker-compose.prod.yml | ssh ${REMOTE_HOST} "cat > ${REMOTE_DIR}/docker-compose.yml"

# 6. 传输 .env 文件
echo ""
echo -e "${YELLOW}📄 Step 6: 传输环境变量配置...${NC}"
if [ -f .env ]; then
    echo "   传输 .env 文件..."
    scp .env ${REMOTE_HOST}:${REMOTE_DIR}/
else
    echo -e "   ${RED}⚠️  未找到 .env 文件，请确保在服务器上配置环境变量${NC}"
fi

# 7. 在远程服务器上加载镜像
echo ""
echo -e "${YELLOW}📥 Step 7: 在远程服务器上加载镜像...${NC}"
ssh ${REMOTE_HOST} "cd ${REMOTE_DIR} && gunzip -f ${TAR_FILE}.gz && docker load -i ${TAR_FILE} && rm ${TAR_FILE}"

# 8. 重启服务
echo ""
echo -e "${YELLOW}🔄 Step 8: 重启服务...${NC}"
ssh ${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose down 2>/dev/null || true && docker compose up -d"

# 9. 等待服务启动
echo ""
echo -e "${YELLOW}⏳ Step 9: 等待服务启动...${NC}"
sleep 5
ssh ${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose ps"

# 10. 清理本地临时文件
echo ""
echo -e "${YELLOW}🧹 Step 10: 清理本地临时文件...${NC}"
rm -f ${TAR_FILE}.gz

echo ""
echo -e "${GREEN}✅ 部署完成！版本: ${IMAGE_TAG}${NC}"
echo ""

SERVER_IP=$(echo ${REMOTE_HOST} | sed 's/.*@//')
echo -e "${CYAN}🌐 访问地址:${NC}"
echo "   • 健康检查:  http://${SERVER_IP}:${REMOTE_PORT}/health"
echo "   • Swagger:   http://${SERVER_IP}:${REMOTE_PORT}/api-docs"
echo "   • MCP HTTP:  http://${SERVER_IP}:${REMOTE_PORT}/mcp"
echo "   • MCP SSE:   http://${SERVER_IP}:${REMOTE_PORT}/mcp/sse"
echo ""

# 11. 测试服务健康状态
echo -e "${YELLOW}🏥 Step 11: 测试服务健康状态...${NC}"
sleep 2
HEALTH_CHECK=$(ssh ${REMOTE_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:${REMOTE_PORT}/health" || echo "000")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "   ${GREEN}✅ 健康检查通过${NC}"
else
    echo -e "   ${RED}⚠️  健康检查失败 (HTTP $HEALTH_CHECK)，请检查日志${NC}"
fi
echo ""

# 12. 显示常用命令
echo -e "${CYAN}📖 常用命令:${NC}"
echo "   查看日志:   ssh ${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker compose logs -f'"
echo "   重启服务:   ssh ${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker compose restart'"
echo "   停止服务:   ssh ${REMOTE_HOST} 'cd ${REMOTE_DIR} && docker compose down'"
echo ""
