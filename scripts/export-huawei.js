#!/usr/bin/env node

/**
 * Export OpenAPI for Huawei Xiaoyi Platform
 * Generates two files:
 * 1. openapi.yaml - Standard OpenAPI 3.0.1 specification
 * 2. ai_plugin.json - Huawei plugin configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard OpenAPI configuration (no Huawei extensions)
const swaggerOptions = {
  definition: {
    openapi: '3.0.1',
    info: {
      title: 'BottleCRM API',
      version: 'V1',
      description: 'BottleCRM客户关系管理系统API，支持线索管理、客户管理、联系人管理、销售机会、任务管理等功能',
    },
    servers: [
      {
        url: 'https://your-domain.com',  // 替换为你的公网地址
        description: 'Production server',
      },
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
          description: 'JWT认证令牌',
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

// Generate OpenAPI specs
console.log('Generating OpenAPI specification for Huawei Xiaoyi Platform...');
const specs = swaggerJsdoc(swaggerOptions);

// Output directory
const outputDir = path.join(__dirname, '..', 'huawei-xiaoyi');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Export openapi.yaml (standard OpenAPI, no extensions)
const yamlSpec = yaml.dump(specs, { indent: 2, lineWidth: -1, quotingType: '"', forceQuotes: true });
const yamlPath = path.join(outputDir, 'openapi.yaml');
fs.writeFileSync(yamlPath, yamlSpec);

// 2. Export ai_plugin.json (Huawei plugin configuration)
const aiPluginConfig = {
  api: {
    type: 'openapi',
    url: 'openapi.yaml'
  },
  action_name: 'bottle_crm_assistant',  // Must be alphanumeric + underscore only
  description_for_human: 'BottleCRM客户关系管理系统AI助手，支持查询客户数据、创建线索任务、分析销售业绩等功能',
  name_for_human: 'BottleCRM智能助手',
  schema_version: 'V1'
};

const jsonPath = path.join(outputDir, 'ai_plugin.json');
fs.writeFileSync(jsonPath, JSON.stringify(aiPluginConfig, null, 2));

// 3. Also export openapi.json for reference
const openapiJsonPath = path.join(outputDir, 'openapi.json');
fs.writeFileSync(openapiJsonPath, JSON.stringify(specs, null, 2));

console.log(`✅ Generated files for Huawei Xiaoyi Platform:`);
console.log(`   📄 ${path.join(outputDir, 'openapi.yaml')}`);
console.log(`   📄 ${path.join(outputDir, 'ai_plugin.json')}`);
console.log(`   📄 ${path.join(outputDir, 'openapi.json')}`);
console.log(`\n📊 Statistics:`);
console.log(`   - Paths: ${Object.keys(specs.paths || {}).length}`);
console.log(`   - Schemas: ${Object.keys(specs.components?.schemas || {}).length}`);
console.log(`\n📝 Usage:`);
console.log(`   1. 将 openapi.yaml 和 ai_plugin.json 打包上传到华为小艺平台`);
console.log(`   2. 或者先部署 API 到公网服务器，然后修改 servers.url 为公网地址`);
