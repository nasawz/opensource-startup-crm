# BottleCRM API

Express.js API for BottleCRM with JWT authentication, Swagger documentation, and configurable request logging.

## Features

- **Multiple Authentication Methods**: 
  - Email/Password registration and login
  - Google OAuth for mobile apps
  - **华为小艺智能体接入**: 支持华为账号授权码登录
- **Multi-tenant**: Organization-based data isolation using existing Prisma schema
- **Swagger Documentation**: Interactive API documentation at `/api-docs`
- **Request Logging**: Configurable input/output HTTP request logging
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **Organization Access Control**: Ensures users can only access their organization's data
- **华为小艺智能体**: 支持鸿蒙Agent通信协议，实现基于华为账号的一键授权登录

## Quick Start

1. The required environment variables are already added to your existing `.env` file.

2. **Generate a secure JWT secret** (required for production):
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL (if available)
openssl rand -hex 32

# Using online generator (for development only)
# Visit: https://generate-secret.vercel.app/32
```

3. Update your `.env` file with the generated secret:
```env
JWT_SECRET=your-generated-secret-key-here
```

4. Start the API server:
```bash
# Development with auto-reload
pnpm run api:dev

# Production
pnpm run api:start
```

5. Visit Swagger documentation:
```
http://localhost:3001/api-docs
```

## Authentication

### Registration & Login

1. **Email/Password Registration**: POST `/auth/register`
   - Request: 
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "SecurePass123"
     }
     ```
   - Password Requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
   - Response: 
     ```json
     {
       "success": true,
       "JWTtoken": "jwt-token",
       "user": {...},
       "organizations": [...]
     }
     ```

2. **Email/Password Login**: POST `/auth/login`
   - Request:
     ```json
     {
       "email": "john@example.com",
       "password": "SecurePass123"
     }
     ```
   - Response: Same as registration

3. **Google OAuth Login**: POST `/auth/google`
   - Request: `{ "idToken": "google-id-token-from-mobile-app" }`
   - Response: `{ "success": true, "JWTtoken": "jwt-token", "user": {...}, "organizations": [...] }`

### Using the API

1. **Use Token**: Include in Authorization header:
   ```
   Authorization: Bearer <jwt-token>
   ```

2. **Select Organization**: Include organization ID in header:
   ```
   X-Organization-ID: <organization-id>
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register with email and password
- `POST /auth/login` - Login with email and password
- `POST /auth/google` - Google OAuth mobile login
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout and revoke current JWT token
- `POST /auth/revoke-all` - Revoke all JWT tokens for current user

### Leads
- `GET /api/leads` - Get organization leads (paginated)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead

### Accounts
- `GET /api/accounts` - Get organization accounts
- `POST /api/accounts` - Create new account

### Contacts
- `GET /api/contacts` - Get organization contacts
- `POST /api/contacts` - Create new contact

### Opportunities
- `GET /api/opportunities` - Get organization opportunities
- `POST /api/opportunities` - Create new opportunity

## Configuration

### Environment Variables

- `API_PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT tokens (required) - **Generate using the commands above**
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

### Logging Configuration

- `LOG_LEVEL`: Logging level (info, debug, error)
- `ENABLE_REQUEST_LOGGING`: Enable/disable request logging (true/false)
- `LOG_REQUEST_BODY`: Log request bodies (true/false)
- `LOG_RESPONSE_BODY`: Log response bodies (true/false)

### Security Features

- **Password Security**:
  - Bcrypt hashing with 12 rounds
  - Password strength validation
  - Secure password storage (never stored in plain text)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Cross-origin request handling
- **JWT Validation**: Token verification on protected routes
- **Token Management**: 
  - Token storage in database
  - Token revocation support
  - Automatic token expiration
- **Organization Isolation**: Users can only access their organization's data

## Data Access Control

All API endpoints enforce organization-based access control:

1. **Authentication Required**: All endpoints (except login) require valid JWT token
2. **Organization Header**: Protected endpoints require `X-Organization-ID` header
3. **Membership Validation**: User must be a member of the specified organization
4. **Data Filtering**: All database queries are filtered by organization ID

## Development

The API uses the same Prisma schema as the main SvelteKit application, ensuring data consistency and leveraging existing:

- Database models and relationships
- Organization-based multi-tenancy
- User role management (ADMIN/USER)
- Super admin access (@micropyramid.com domain)

## Testing with Swagger

Access the interactive API documentation at `http://localhost:3001/api-docs` to:

1. Test authentication endpoints
2. Explore available endpoints
3. Test API calls with different parameters
4. View request/response schemas

---

## 华为小艺智能体接入

### 概述

BottleCRM 支持作为智能体接入华为小艺平台，实现基于华为账号的一键授权登录。

### 华为开发者联盟配置

在华为开发者联盟后台配置账号授权服务时，需要填写以下信息：

#### 基本信息

- **API URL**: `https://your-domain.com/agent/message`
  - 这是智能体访问地址，用户在智能体里绑定账号时调用此地址获取会话凭证

#### 认证信息

推荐使用 **Header** 认证方式（更简单安全）：

- **认证方式**: Header
- **位置**: Header
- **Header 域传递参数**:
  - **Key**: `X-Agent-Api-Key`（可自定义）
  - **Value**: 你设置的 API 密钥

配置后，小艺APP调用时会携带以下 Header：
```
X-Agent-Api-Key: your-configured-secret-value
```

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 华为小艺智能体配置
HUAWEI_APP_ID=your-huawei-app-id           # 华为开发者联盟账号服务的 AppID
HUAWEI_APP_SECRET=your-huawei-app-secret   # 华为开发者联盟账号服务的 App Secret

# 智能体 API 认证配置（与华为后台配置一致）
HUAWEI_AGENT_API_KEY=X-Agent-Api-Key       # Header 的 key 名称
HUAWEI_AGENT_API_SECRET=your-api-secret    # Header 的 value 值

# 可选配置
HUAWEI_SESSION_EXPIRES_HOURS=168           # 智能体会话有效期（小时），默认7天
HUAWEI_REDIRECT_URI=                       # 华为账号授权回调地址（如需要）
```

### API 端点

#### 1. 智能体消息入口（小艺APP调用）

**POST** `/agent/message`

用于处理小艺APP发送的授权和解除授权请求。

**授权请求示例**:
```bash
curl 'https://your-domain.com/agent/message' \
  -H 'Content-Type: application/json' \
  -H 'X-Agent-Api-Key: your-api-secret' \
  -H 'agent-session-id: optional-existing-session-id' \
  -d '{
    "jsonrpc": "2.0",
    "id": "unique-message-id",
    "method": "authorize",
    "params": {
      "message": {
        "role": "user",
        "parts": [{
          "kind": "data",
          "data": {
            "authCode": "huawei-authorization-code"
          }
        }]
      }
    }
  }'
```

**授权响应**:
```json
{
  "jsonrpc": "2.0",
  "id": "unique-message-id",
  "result": {
    "version": "1.0",
    "agentLoginSessionId": "generated-session-id"
  },
  "error": {
    "code": 0,
    "message": "success"
  }
}
```

**解除授权请求示例**:
```bash
curl 'https://your-domain.com/agent/message' \
  -H 'Content-Type: application/json' \
  -H 'X-Agent-Api-Key: your-api-secret' \
  -d '{
    "jsonrpc": "2.0",
    "id": "unique-message-id",
    "method": "deauthorize",
    "params": {
      "message": {
        "role": "user",
        "parts": [{
          "kind": "data",
          "data": {
            "agentLoginSessionId": "session-to-revoke",
            "cpUserId": "optional-user-id"
          }
        }]
      }
    }
  }'
```

#### 2. 华为账号登录（标准 REST API）

**POST** `/agent/auth/huawei`

使用华为授权码进行登录/注册，返回标准 JWT token。

**请求**:
```bash
curl 'https://your-domain.com/agent/auth/huawei' \
  -H 'Content-Type: application/json' \
  -d '{
    "authCode": "huawei-authorization-code"
  }'
```

**响应**:
```json
{
  "success": true,
  "JWTtoken": "jwt-token-for-api-access",
  "user": {
    "id": "user-id",
    "email": "huawei_xxx@agent.bottlecrm.com",
    "name": "用户1234",
    "phone": "138****1234",
    "huaweiOpenId": "huawei-open-id"
  },
  "organizations": [],
  "isNewUser": true
}
```

### 工作流程

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   小艺APP    │      │ BottleCRM   │      │  华为账号    │
│             │      │   Server    │      │   服务      │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │ 1. 用户点击授权     │                    │
       │ ─────────────────> │                    │
       │                    │                    │
       │                    │ 2. 验证 API Key    │
       │                    │ ─────────────────> │
       │                    │                    │
       │                    │ 3. authCode 换取   │
       │                    │    用户信息        │
       │                    │ <───────────────── │
       │                    │                    │
       │                    │ 4. 创建/更新用户   │
       │                    │    生成会话ID      │
       │                    │                    │
       │ 5. 返回            │                    │
       │    agentLoginSessionId                  │
       │ <───────────────── │                    │
       │                    │                    │
       │ 6. 后续请求携带    │                    │
       │    agentLoginSessionId                  │
       │ ─────────────────> │                    │
       │                    │                    │
```

### 数据库模型

新增的数据库模型：

**User 表新增字段**:
- `huaweiOpenId`: 华为账号唯一标识
- `huaweiUnionId`: 华为账号联合ID（跨应用）
- `huaweiPhone`: 从华为账号获取的手机号

**HuaweiAgentSession 表**:
- 存储智能体会话信息
- `agentLoginSessionId`: 返回给小艺APP的会话凭证
- 支持会话过期和撤销

### 使用 agentLoginSessionId 调用 API

授权成功后，小艺APP会保存 `agentLoginSessionId`，后续调用 CRM API 时通过 `agent-session-id` Header 携带该凭证。

**统一认证机制**：所有 API 端点同时支持两种认证方式：

| 认证方式 | Header | 适用场景 |
|----------|--------|----------|
| JWT Token | `Authorization: Bearer <token>` | 标准 API 调用、Web/移动端 |
| 智能体会话 | `agent-session-id: <agentLoginSessionId>` | 华为小艺智能体调用 |

**示例：使用 agentLoginSessionId 调用线索列表 API**

```bash
curl 'https://your-domain.com/leads' \
  -H 'Content-Type: application/json' \
  -H 'agent-session-id: your-agent-login-session-id' \
  -H 'X-Organization-ID: your-organization-id'
```

**示例：使用 agentLoginSessionId 创建任务**

```bash
curl 'https://your-domain.com/tasks' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'agent-session-id: your-agent-login-session-id' \
  -H 'X-Organization-ID: your-organization-id' \
  -d '{
    "subject": "回访客户张三",
    "dueDate": "2024-01-20T14:00:00Z",
    "priority": "High",
    "description": "讨论合作方案"
  }'
```

**示例：使用 agentLoginSessionId 查看仪表板**

```bash
curl 'https://your-domain.com/dashboard' \
  -H 'agent-session-id: your-agent-login-session-id' \
  -H 'X-Organization-ID: your-organization-id'
```

**认证优先级**：
1. 如果同时提供了 `Authorization` 和 `agent-session-id`，优先使用 JWT Token 认证
2. 如果只提供 `agent-session-id`，使用华为智能体会话认证

**会话过期处理**：
- 当 `agentLoginSessionId` 过期或无效时，API 返回 401 错误
- 错误响应包含 `code: 'AGENT_SESSION_INVALID'`
- 小艺APP 收到此错误后应重新发起授权流程

```json
{
  "error": "Invalid or expired agent session.",
  "code": "AGENT_SESSION_INVALID"
}
```

### 安全注意事项

1. **API Key 保护**: 确保 `HUAWEI_AGENT_API_SECRET` 足够复杂且保密
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **会话管理**: 定期清理过期会话
4. **日志监控**: 监控异常授权请求