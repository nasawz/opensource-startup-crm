#!/bin/bash

# ================================
# BottleCRM API + MCP Server - Docker 构建脚本
# ================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

IMAGE_NAME="bottlecrm-api"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   BottleCRM API + MCP Server - Docker 构建                    ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📦 构建镜像: ${FULL_IMAGE_NAME}${NC}"
echo ""

docker build \
    -t "${FULL_IMAGE_NAME}" \
    -f Dockerfile \
    .

echo ""
echo -e "${GREEN}✅ 构建完成!${NC}"
echo ""
echo -e "镜像信息:"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""
echo -e "${YELLOW}运行容器:${NC}"
echo "  docker run -d -p 3002:3002 --name bottlecrm-api ${FULL_IMAGE_NAME}"
echo ""
echo -e "${YELLOW}或使用 docker-compose:${NC}"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
