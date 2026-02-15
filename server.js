import express from 'express';
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

dotenv.config();

const app = express();
const logger = createLogger();
const PORT = process.env.PORT || 3002;
const PROTOCOL = process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http';

// Trust proxy setting for rate limiting
app.set('trust proxy', 1);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
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
        url: `https://1333h44n-3002.inc1.devtunnels.ms/`,
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

// Export Swagger specs as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Export Swagger specs as YAML
app.get('/api-docs.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  // Convert JSON to YAML
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

if (process.env.ENABLE_HTTPS === 'true') {
  try {
    const httpsOptions = {
      key: fs.readFileSync('certs/server.key'),
      cert: fs.readFileSync('certs/server.cert')
    };
    
    https.createServer(httpsOptions, app).listen(PORT, () => {
      logger.info(`BottleCRM API server running on port ${PORT} (HTTPS)`);
      logger.info(`Swagger documentation available at https://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start HTTPS server:', error);
    process.exit(1);
  }
} else {
  app.listen(PORT, () => {
    logger.info(`BottleCRM API server running on port ${PORT}`);
    logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

export default app;