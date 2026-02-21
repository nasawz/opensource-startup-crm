import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { createLogger } from './api/config/logger.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import authRoutes from './api/routes/auth.js';
import dashboardRoutes from './api/routes/dashboard.js';
import leadRoutes from './api/routes/leads.js';
import accountRoutes from './api/routes/accounts.js';
import contactRoutes from './api/routes/contacts.js';
import opportunityRoutes from './api/routes/opportunities.js';
import taskRoutes from './api/routes/tasks.js';
import organizationRoutes from './api/routes/organizations.js';
import huaweiAgentRoutes from './api/routes/huaweiAgent.js';
import { svelteCrmMcpServer } from './api/mastra/mcp/index.js';

dotenv.config();

const app = express();
const logger = createLogger();
const PORT = process.env.PORT || 3002;
const PROTOCOL = process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http';

app.set('trust proxy', 1);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BottleCRM API',
      version: '1.0.0',
      description: 'Multi-tenant CRM API with JWT authentication',
      'x-huawei-plugin-name': 'BottleCRM智能助手',
      'x-huawei-plugin-desc': 'BottleCRM客户关系管理系统AI助手，支持查询客户数据、创建线索任务、分析销售业绩等功能',
      'x-huawei-version': '1.0.0',
      'x-huawei-contact': 'support@bottlecrm.com',
    },
    'x-huawei-api-type': 'openapi',
    'x-huawei-category': '办公效率',
    'x-huawei-tags': ['CRM', '客户管理', '销售', '办公'],
    servers: [
      {
        url: `${PROTOCOL}://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: `http://api-bottlecrm.xiangshikeji.com/`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./api/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.get('/api-docs.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  const yamlSpec = yaml.dump(specs, { indent: 2, lineWidth: -1 });
  res.send(yamlSpec);
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/leads', leadRoutes);
app.use('/accounts', accountRoutes);
app.use('/contacts', contactRoutes);
app.use('/opportunities', opportunityRoutes);
app.use('/tasks', taskRoutes);
app.use('/organizations', organizationRoutes);
app.use('/agent', huaweiAgentRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
    },
  });
});

// MCP Server 信息端点
app.get('/mcp/info', (req, res) => {
  const serverInfo = svelteCrmMcpServer.getServerInfo();
  res.json(serverInfo);
});

app.get('/mcp/detail', (req, res) => {
  const serverDetail = svelteCrmMcpServer.getServerDetail();
  res.json(serverDetail);
});

app.get('/mcp/tools', (req, res) => {
  const toolList = svelteCrmMcpServer.getToolListInfo();
  res.json(toolList);
});

app.use(errorHandler);

/**
 * 创建 HTTP server，同时处理 Express 路由和 MCP 协议请求。
 * MCP 协议需要直接访问原始的 request/response stream，
 * 因此在 Express 之前拦截 /mcp 路径的请求。
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // MCP 路径需要额外的 CORS 头
  if (pathname.startsWith('/mcp')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
  }

  try {
    // MCP HTTP 端点 - Streamable HTTP transport
    if (pathname === '/mcp') {
      await svelteCrmMcpServer.startHTTP({
        url,
        httpPath: '/mcp',
        req,
        res,
      });
      return;
    }

    // MCP SSE 端点
    if (pathname === '/mcp/sse' && req.method === 'GET') {
      await svelteCrmMcpServer.startSSE({
        url,
        ssePath: '/mcp/sse',
        messagePath: '/mcp/messages',
        req,
        res,
      });
      return;
    }

    // MCP SSE 消息端点
    if (pathname === '/mcp/messages' && req.method === 'POST') {
      await svelteCrmMcpServer.startSSE({
        url,
        ssePath: '/mcp/sse',
        messagePath: '/mcp/messages',
        req,
        res,
      });
      return;
    }

    // 其他请求交给 Express 处理
    app(req, res);
  } catch (error) {
    logger.error('Server error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  }
});

if (process.env.ENABLE_HTTPS === 'true') {
  try {
    const httpsOptions = {
      key: fs.readFileSync('certs/server.key'),
      cert: fs.readFileSync('certs/server.cert')
    };

    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(PORT, () => {
      logger.info(`BottleCRM API server running on port ${PORT} (HTTPS)`);
      logger.info(`Swagger documentation available at https://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start HTTPS server:', error);
    process.exit(1);
  }
} else {
  server.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   BottleCRM API + MCP Server                                  ║
║                                                               ║
║   服务已启动: http://localhost:${PORT}                          ║
║                                                               ║
║   API 端点:                                                   ║
║   • 健康检查:    GET  /health                                 ║
║   • Swagger:     GET  /api-docs                               ║
║   • Auth:        ALL  /auth/*                                 ║
║   • Leads:       ALL  /leads/*                                ║
║   • Accounts:    ALL  /accounts/*                             ║
║   • Contacts:    ALL  /contacts/*                             ║
║   • Tasks:       ALL  /tasks/*                                ║
║                                                               ║
║   MCP 端点:                                                   ║
║   • MCP 信息:    GET  /mcp/info                               ║
║   • MCP 详情:    GET  /mcp/detail                             ║
║   • MCP 工具:    GET  /mcp/tools                              ║
║   • MCP HTTP:    ALL  /mcp                                    ║
║   • MCP SSE:     GET  /mcp/sse                                ║
║                                                               ║
║   MCP 客户端连接:                                              ║
║   • HTTP URL:  http://localhost:${PORT}/mcp                     ║
║   • SSE URL:   http://localhost:${PORT}/mcp/sse                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  await svelteCrmMcpServer.close();
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  await svelteCrmMcpServer.close();
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

export default app;
