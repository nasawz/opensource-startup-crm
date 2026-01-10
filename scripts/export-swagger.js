#!/usr/bin/env node

/**
 * Export Swagger/OpenAPI specification to file
 * Usage: pnpm swagger:export [--format=json|yaml] [--output=path/to/file]
 */

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let format = 'json';
let outputPath = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  // Support both --format value and --format=value
  if (arg.startsWith('--format=')) {
    format = arg.split('=')[1];
  } else if (arg === '--format' && args[i + 1]) {
    format = args[++i];
  }
  // Support both --output value and --output=value
  else if (arg.startsWith('--output=')) {
    outputPath = arg.split('=')[1];
  } else if (arg === '--output' && args[i + 1]) {
    outputPath = args[++i];
  }
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BottleCRM API',
      version: '1.0.0',
      description: 'Multi-tenant CRM API with JWT authentication',
      // 华为小艺平台需要的字段
      pluginName: 'BottleCRM智能助手',
      pluginDesc: 'BottleCRM客户关系管理系统AI助手，支持查询客户数据、创建线索任务、分析销售业绩等功能',
      contact: 'support@bottlecrm.com',
      // 保留华为扩展字段
      'x-huawei-plugin-name': 'BottleCRM智能助手',
      'x-huawei-plugin-desc': 'BottleCRM客户关系管理系统AI助手，支持查询客户数据、创建线索任务、分析销售业绩等功能',
      'x-huawei-version': '1.0.0',
      'x-huawei-contact': 'support@bottlecrm.com',
    },
    'x-huawei-api-type': 'openapi',
    'x-huawei-category': '办公效率',
    'x-huawei-tags': ['CRM', '客户管理', '销售', '办公'],
    // 华为平台需要的 api 字段
    api: {
      name: 'BottleCRM API',
      description: 'BottleCRM客户关系管理系统API',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
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

// Generate specs
console.log('Generating OpenAPI specification...');
const specs = swaggerJsdoc(swaggerOptions);

// Determine default output path
if (!outputPath) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  outputPath = path.join(__dirname, '..', `openapi.${format}`);
}

// Convert and write
let content;
let contentType;

if (format === 'yaml' || format === 'yml') {
  content = yaml.dump(specs, { indent: 2, lineWidth: -1 });
  contentType = 'YAML';
} else {
  content = JSON.stringify(specs, null, 2);
  contentType = 'JSON';
}

// Write to file
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, content);

console.log(`✅ OpenAPI ${contentType} specification exported to:`);
console.log(`   ${path.resolve(outputPath)}`);
console.log(`\n📊 Statistics:`);
console.log(`   - Paths: ${Object.keys(specs.paths || {}).length}`);
console.log(`   - Schemas: ${Object.keys(specs.components?.schemas || {}).length}`);
