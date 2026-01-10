# BottleCRM 智能体功能设计文档

## 1. 概述

### 1.1 项目背景

BottleCRM 智能体是一个基于 AI 的 CRM 智能助手，通过自然语言交互帮助用户高效管理客户关系。智能体利用现有的 BottleCRM API，实现对话式的 CRM 操作，降低用户学习成本，提升工作效率。

### 1.2 设计目标

- **自然交互**: 用户可通过对话完成所有 CRM 操作
- **智能理解**: 自动识别用户意图，提取关键信息
- **主动建议**: 基于数据智能分析，提供业务建议
- **多场景支持**: 覆盖销售、客服、管理等场景
- **无缝集成**: 与现有 API 完美对接

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     用户交互层                            │
│  Web Chat / 移动端 / 企业微信 / 钉钉 / Slack            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    智能体核心层                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ 意图识别     │  │ 实体提取     │  │ 上下文管理   │    │
│  │ NLU Engine  │  │ Entity Ext. │  │ Context Mgr │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         ↓                 ↓                 ↓            │
│  ┌─────────────────────────────────────────────────┐  │
│  │            对话管理与策略引擎                      │  │
│  │         Dialogue & Policy Engine                 │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    API 适配层                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 认证适配  │ │ 数据适配  │ │ 业务适配  │ │ 缓存层   │  │
│  │ Auth     │ │ Data     │ │ Business │ │ Cache    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 BottleCRM API                           │
│  认证 / 组织 / 线索 / 账户 / 联系人 / 机会 / 任务       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 核心功能设计

### 2.1 意图识别体系

#### 2.1.1 查询类意图 (Query Intents)

| 意图 ID | 意图名称 | 示例语句 | API 映射 |
|---------|----------|----------|----------|
| `Q_DASH_BOARD` | 查看仪表板 | "今天的数据怎么样?" | `GET /dashboard` |
| `Q_LEAD_LIST` | 查询线索列表 | "看看最近的新线索" | `GET /leads` |
| `Q_LEAD_DETAIL` | 查询线索详情 | "张三这个线索怎么样?" | `GET /leads/{id}` |
| `Q_ACCOUNT_LIST` | 查询客户列表 | "列出所有客户" | `GET /accounts` |
| `Q_CONTACT_LIST` | 查询联系人列表 | "查一下XX公司的联系人" | `GET /contacts` |
| `Q_OPPORTUNITY_LIST` | 查询销售机会 | "有多少在谈的项目?" | `GET /opportunities` |
| `Q_TASK_LIST` | 查询任务列表 | "我今天有什么任务?" | `GET /tasks` |
| `Q_ORG_LIST` | 查询组织列表 | "我有哪些组织?" | `GET /organizations` |

#### 2.1.2 创建类意图 (Create Intents)

| 意图 ID | 意图名称 | 示例语句 | API 映射 |
|---------|----------|----------|----------|
| `C_LEAD` | 创建线索 | "新增一个线索，李四..." | `POST /leads` |
| `C_ACCOUNT` | 创建客户 | "添加一个新客户XX公司" | `POST /accounts` |
| `C_CONTACT` | 创建联系人 | "给XX公司加个联系人" | `POST /contacts` |
| `C_OPPORTUNITY` | 创建销售机会 | "创建一个50万的机会" | `POST /opportunities` |
| `C_TASK` | 创建任务 | "明天提醒我联系客户" | `POST /tasks` |
| `C_ORG` | 创建组织 | "创建一个新组织" | `POST /organizations` |

#### 2.1.3 更新类意图 (Update Intents)

| 意图 ID | 意图名称 | 示例语句 | API 映射 |
|---------|----------|----------|----------|
| `U_LEAD_STATUS` | 更新线索状态 | "把这个线索标记为已联系" | `PUT /leads/{id}` |
| `U_TASK_STATUS` | 更新任务状态 | "把任务标记为完成" | `PUT /tasks/{id}` |
| `U_OPPORTUNITY` | 更新销售机会 | "把项目金额改成100万" | `PUT /opportunities/{id}` |

#### 2.1.4 删除类意图 (Delete Intents)

| 意图 ID | 意图名称 | 示例语句 | API 映射 |
|---------|----------|----------|----------|
| `D_TASK` | 删除任务 | "把这个任务删了" | `DELETE /tasks/{id}` |

#### 2.1.5 分析类意图 (Analysis Intents)

| 意图 ID | 意图名称 | 示例语句 | 功能描述 |
|---------|----------|----------|----------|
| `A_SUMMARY` | 数据汇总 | "本周的销售情况如何?" | 聚合分析仪表板数据 |
| `A_FORECAST` | 销售预测 | "下个月大概能成多少单?" | 基于机会预测收入 |
| `A_PERFORMANCE` | 业绩分析 | "我本月的业绩怎么样?" | 个人业绩统计 |
| `A_RECOMMENDATION` | 智能建议 | "我应该优先跟进哪些客户?" | AI 推荐跟进策略 |

---

### 2.2 实体提取设计

#### 2.1.1 基础实体类型

| 实体类型 | 提取示例 | 正则/NER 模型 |
|----------|----------|---------------|
| `PERSON_NAME` | "张三"、"李四" | 人名识别模型 |
| `COMPANY_NAME` | "腾讯公司"、"阿里巴巴" | 公司名识别模型 |
| `EMAIL` | "zhang@example.com" | 正则表达式 |
| `PHONE` | "13800138000" | 正则表达式 |
| `MONEY` | "50万"、"100000" | 金额识别模型 |
| `DATE` | "明天"、"下周五"、"2024-01-15" | 时间解析库 |
| `STATUS` | "已联系"、"进行中" | 枚举匹配 |
| `INDUSTRY` | "互联网"、"金融" | 行业词典 |
| `PRIORITY` | "高优先级"、"紧急" | 枚举匹配 |

#### 2.2.2 CRM 专用实体

| 实体类型 | 描述 | 示例值 |
|----------|------|--------|
| `LEAD_STATUS` | 线索状态 | NEW, PENDING, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED |
| `LEAD_SOURCE` | 线索来源 | WEB, PHONE_INQUIRY, PARTNER_REFERRAL, COLD_CALL, TRADE_SHOW |
| `LEAD_RATING` | 线索评级 | Hot, Warm, Cold |
| `TASK_STATUS` | 任务状态 | Not Started, In Progress, Completed, Deferred, Waiting |
| `TASK_PRIORITY` | 任务优先级 | High, Normal, Low |
| `OPPORTUNITY_STAGE` | 机会阶段 | 自定义销售阶段 |

---

### 2.3 对话管理设计

#### 2.3.1 对话状态机

```
                    ┌──────────────┐
                    │   IDLE       │  空闲状态
                    └───────┬──────┘
                            │ 用户输入
                            ↓
                   ┌────────────────┐
                   │  INTENT_DETECT  │  意图识别
                   └───────┬────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ↓               ↓               ↓
    ┌────────────┐ ┌─────────────┐ ┌─────────────┐
    │   QUERY    │ │   CREATE    │ │   ACTION    │
    └─────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          ↓               ↓               ↓
    ┌────────────┐ ┌─────────────┐ ┌─────────────┐
    │ENTITY_FILL │ │ SLOT_FILL   │ │CONFIRM_EXEC │
    └─────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          └───────────────┴───────────────┘
                            │
                            ↓
                    ┌──────────────┐
                    │ RESPONSE_GEN │  生成响应
                    └───────┬──────┘
                            │
                            ↓
                    ┌──────────────┐
                    │   IDLE       │  返回空闲
                    └──────────────┘
```

#### 2.3.2 槽位填充 (Slot Filling)

针对创建类操作，需要收集完整信息：

**创建线索槽位设计**:
```javascript
{
  intent: "C_LEAD",
  slots: {
    firstName: { required: true, type: "PERSON_NAME", prompt: "请问联系人姓什么?" },
    lastName: { required: true, type: "PERSON_NAME", prompt: "请问联系人名字叫什么?" },
    email: { required: true, type: "EMAIL", prompt: "请提供邮箱地址" },
    phone: { required: false, type: "PHONE" },
    company: { required: false, type: "COMPANY_NAME" },
    title: { required: false, type: "STRING" },
    industry: { required: false, type: "INDUSTRY" },
    leadSource: { required: false, type: "LEAD_SOURCE", default: "OTHER" },
    rating: { required: false, type: "LEAD_RATING", default: "Warm" }
  },
  collected: {}  // 已收集的槽位
}
```

**多轮对话示例**:
```
用户: 新增一个线索
智能体: 好的，请提供联系人的姓名

用户: 叫张三
智能体: 请问张三的邮箱地址是什么?

用户: zhangsan@example.com
智能体: 请问他的公司是?

用户: 腾讯公司
智能体: 好的，我来为您创建线索：
- 姓名: 张三
- 邮箱: zhangsan@example.com
- 公司: 腾讯公司

确认创建吗? (是/否)

用户: 是
智能体: ✓ 线索创建成功！ID: lead_123456
```

---

### 2.4 智能分析功能

#### 2.4.1 销售漏斗分析

```javascript
// API: GET /dashboard + GET /opportunities
// 功能: 分析销售漏斗各阶段的转化情况

{
  analysisType: "SALES_FUNNEL",
  data: {
    stages: [
      { name: "线索", count: 100, value: 0 },
      { name: "已确认", count: 45, value: 0 },
      { name: "方案中", count: 20, value: 2000000 },
      { name: "谈判中", count: 10, value: 5000000 },
      { name: "即将成交", count: 5, value: 3000000 },
      { name: "已成交", count: 3, value: 1500000 }
    ],
    conversionRates: {
      leadToQualified: "45%",
      qualifiedToProposal: "44%",
      proposalToNegotiation: "50%",
      negotiationToClosing: "30%"
    },
    insights: [
      "从谈判到成交的转化率较低(30%)，建议加强谈判阶段支持",
      "高价值机会集中在谈判阶段，需要重点跟进"
    ]
  }
}
```

#### 2.4.2 工作负载分析

```javascript
// API: GET /tasks + GET /tasks?ownerId={userId}
// 功能: 分析团队/个人的工作负载

{
  analysisType: "WORKLOAD",
  data: {
    totalTasks: 50,
    byStatus: {
      "Not Started": 15,
      "In Progress": 20,
      "Overdue": 5,
      "Completed": 10
    },
    byPriority: {
      "High": 8,
      "Normal": 35,
      "Low": 7
    },
    recommendations: [
      "您有5个任务已逾期，建议优先处理",
      "高优先级任务占比16%，工作压力适中"
    ]
  }
}
```

#### 2.4.3 客户健康度分析

```javascript
// API: GET /accounts + GET /opportunities + GET /tasks
// 功能: 评估客户的活跃度和价值

{
  analysisType: "ACCOUNT_HEALTH",
  data: {
    accountId: "acc_123",
    healthScore: 85,  // 0-100
    factors: {
      opportunityValue: 40,    // 销售机会金额
      interactionFrequency: 25, // 交互频率
      recentActivity: 20,      // 最近活跃度
      taskCompletion: 10       // 任务完成率
    },
    status: "健康",
    suggestions: [
      "该客户有大额机会在谈，建议加强跟进",
      "距离上次联系已超过7天，建议主动联系"
    ]
  }
}
```

---

### 2.5 智能推荐引擎

#### 2.5.1 跟进推荐

```javascript
// 基于线索评分、最后联系时间、机会价值等综合推荐

{
  recommendationType: "FOLLOW_UP",
  prioritizedLeads: [
    {
      leadId: "lead_001",
      name: "张三",
      company: "腾讯",
      score: 95,
      reasons: [
        "高热线索，最近活跃",
        "有50万销售机会关联",
        "超过3天未联系"
      ],
      suggestedAction: "电话跟进产品演示",
      urgency: "高"
    },
    // ... 更多推荐
  ]
}
```

#### 2.5.2 最佳时间推荐

```javascript
// 分析历史联系成功时间，推荐最佳联系时间

{
  recommendationType: "BEST_TIME",
  contact: "contact_123",
  bestTimes: [
    { day: "周二", hour: "10:00-11:00", successRate: 0.75 },
    { day: "周四", hour: "14:00-15:00", successRate: 0.68 }
  ],
  reason: "基于历史联系数据分析"
}
```

---

## 3. 用户交互设计

### 3.1 快捷命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `/status` | 快速查看仪表板 | `/status` |
| `/tasks` | 查看今日任务 | `/tasks today` |
| `/leads` | 查看新线索 | `/leads new` |
| `/create` | 快速创建 | `/create lead` |
| `/help` | 帮助文档 | `/help` |

### 3.2 消息类型

#### 3.2.1 文本消息
```
用户: 今天有多少新线索?
智能体: 今天新增了 5 条线索，其中 2 条已标记为热线索
```

#### 3.2.2 结构化卡片
```json
{
  "type": "card",
  "title": "销售仪表板",
  "data": {
    "总线索": 120,
    "转化率": "25%",
    "在谈机会": 15,
    "预计收入": "¥2,500,000"
  },
  "actions": [
    { "label": "查看详情", "action": "view_dashboard" },
    { "label": "导出报告", "action": "export_report" }
  ]
}
```

#### 3.2.3 确认对话框
```json
{
  "type": "confirmation",
  "message": "确认删除这个任务吗?",
  "data": { "taskId": "task_123", "subject": "联系客户" },
  "actions": [
    { "label": "确认", "action": "confirm_delete" },
    { "label": "取消", "action": "cancel" }
  ]
}
```

### 3.3 对话示例

#### 示例 1: 查询场景
```
用户: 我今天有什么任务?
智能体: 您今天有 3 个待办任务：

📋 高优先级:
  1. 联系腾讯的张总 (截止: 今天 15:00)
  2. 准备阿里巴巴的方案 (截止: 今天 18:00)

📋 普通优先级:
  3. 更新客户档案 (截止: 今天 20:00)

需要我帮您查看某个任务的详情吗?
```

#### 示例 2: 创建场景
```
用户: 帮我加个任务，明天下午2点提醒我回访李四
智能体: 好的，我已为您创建任务：

📝 任务详情
├─ 主题: 回访李四
├─ 时间: 明天 14:00
├─ 优先级: 普通
└─ 状态: 未开始

需要我关联到具体的客户或销售机会吗?
```

#### 示例 3: 分析场景
```
用户: 这周的销售情况怎么样?
智能体: 📊 本周销售数据概览

✅ 亮点:
  • 新增线索: 28 条 (↑ 15% vs 上周)
  • 转化线索: 7 条
  • 新增机会: 4 个，预计金额 ¥850,000

⚠️ 需要关注:
  • 有 3 个高价值机会超过一周未更新
  • 温线索转化率偏低(18%)

💡 建议:
  1. 优先跟进阿里巴巴的50万机会 (已5天未联系)
  2. 加强温线索的培育力度
  3. 腾讯公司的项目即将到截止日期

需要我帮您查看具体的跟进建议吗?
```

---

## 4. 技术实现建议

### 4.1 技术栈选型

#### 4.1.1 核心框架
```
后端服务:
├── Node.js + Express / Python FastAPI
├── NLU 框架: RASA / Dialogflow CX / LangChain
├── LLM 集成: OpenAI GPT-4 / Claude / 本地模型
└── 向量数据库: Pinecone / Weaviate / Chroma

前端界面:
├── React / Vue.js (Web 界面)
├── React Native / Flutter (移动端)
└── 集成: 企业微信/钉钉/Slack SDK
```

#### 4.1.2 AI 模型选择

| 功能 | 推荐模型 | 理由 |
|------|----------|------|
| 意图识别 | GPT-4 / Claude 3.5 | 高准确率，支持 Few-shot |
| 实体提取 | spaCy / Hugging Face NER | 专一模型，速度快 |
| 对话生成 | GPT-4o-mini | 成本低，响应快 |
| 数据分析 | Code Interpreter / Function Calling | 结构化数据分析 |
| 语义搜索 | Embeddings + Vector DB | 语义匹配查询 |

### 4.2 系统架构

```
┌────────────────────────────────────────────────────────┐
│                      负载均衡器                          │
└────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌───────────────┐                     ┌───────────────┐
│  智能体服务 A  │                     │  智能体服务 B  │
│  ┌─────────┐  │                     │  ┌─────────┐  │
│  │ 对话引擎 │  │                     │  │ 对话引擎 │  │
│  │ NLU     │  │                     │  │ NLU     │  │
│  │ Context │  │                     │  │ Context │  │
│  └─────────┘  │                     │  └─────────┘  │
└───────┬───────┘                     └───────┬───────┘
        │                                     │
        └───────────────┬─────────────────────┘
                        ↓
            ┌───────────────────────┐
            │    Redis 缓存集群      │
            │  • 对话上下文          │
            │  • 用户会话            │
            │  • 热点数据            │
            └───────────────────────┘
                        ↓
            ┌───────────────────────┐
            │   消息队列 (RabbitMQ)  │
            │  • 异步任务            │
            │  • 分析任务            │
            └───────────────────────┘
                        ↓
            ┌───────────────────────┐
            │  BottleCRM API Gateway │
            └───────────────────────┘
```

### 4.3 数据流设计

#### 4.3.1 对话处理流程

```python
async def process_message(user_message, user_context):
    # 1. 加载对话历史
    conversation = await load_conversation(user_context.user_id)

    # 2. 意图识别
    intent_result = await intent_recognizer.predict(user_message, conversation)

    # 3. 实体提取
    entities = await entity_extractor.extract(user_message, intent_result)

    # 4. 槽位填充检查
    if intent_result.requires_slots:
        missing_slots = check_missing_slots(intent_result, entities, conversation)
        if missing_slots:
            return generate_slot_filling_prompt(missing_slots)

    # 5. API 调用准备
    api_request = build_api_request(intent_result, entities, user_context)

    # 6. 执行 API 调用
    api_response = await call_bottlecrm_api(api_request)

    # 7. 响应生成
    response = await response_generator.generate(
        user_message,
        intent_result,
        api_response,
        conversation
    )

    # 8. 保存对话历史
    await save_conversation(user_context.user_id, user_message, response)

    return response
```

#### 4.3.2 Function Calling 设计

```javascript
// 为 LLM 定义可调用的函数
const functions = [
  {
    name: "get_dashboard_metrics",
    description: "获取仪表板核心指标",
    parameters: {
      type: "object",
      properties: {
        organizationId: { type: "string", description: "组织ID" }
      },
      required: ["organizationId"]
    },
    handler: async (params) => {
      return await apiClient.get('/dashboard/metrics', {
        headers: { 'X-Organization-ID': params.organizationId }
      });
    }
  },
  {
    name: "create_lead",
    description: "创建新线索",
    parameters: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string", format: "email" },
        company: { type: "string" },
        leadSource: { type: "string", enum: ["WEB", "PHONE_INQUIRY", ...] },
        rating: { type: "string", enum: ["Hot", "Warm", "Cold"] }
      },
      required: ["firstName", "lastName", "email"]
    },
    handler: async (params) => {
      return await apiClient.post('/leads', params);
    }
  },
  {
    name: "get_tasks",
    description: "获取任务列表，支持过滤",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string" },
        priority: { type: "string" },
        ownerId: { type: "string" },
        limit: { type: "number", default: 50 }
      }
    },
    handler: async (params) => {
      return await apiClient.get('/tasks', { params });
    }
  },
  {
    name: "analyze_sales_funnel",
    description: "分析销售漏斗",
    parameters: {
      type: "object",
      properties: {
        organizationId: { type: "string" },
        timeRange: { type: "string", enum: ["week", "month", "quarter"] }
      },
      required: ["organizationId"]
    },
    handler: async (params) => {
      // 聚合多个 API 调用进行分析
      const [leads, opportunities] = await Promise.all([
        apiClient.get('/leads'),
        apiClient.get('/opportunities')
      ]);
      return analyzeFunnelData(leads, opportunities);
    }
  }
];
```

### 4.4 缓存策略

```javascript
// Redis 缓存设计
const cacheStrategy = {
  // 用户会话缓存 (1小时)
  userSession: {
    key: `session:${userId}`,
    ttl: 3600,
    data: {
      token: "",
      organizationId: "",
      currentContext: {}
    }
  },

  // 对话历史缓存 (24小时)
  conversationHistory: {
    key: `conv:${userId}`,
    ttl: 86400,
    data: [
      { role: "user", content: "...", timestamp: "..." },
      { role: "assistant", content: "...", timestamp: "..." }
    ]
  },

  // 热点数据缓存 (5分钟)
  hotData: {
    key: `data:${entityType}:${orgId}`,
    ttl: 300,
    data: {} // 仪表板数据、高频查询的线索等
  },

  // 用户偏好缓存 (7天)
  userPreferences: {
    key: `pref:${userId}`,
    ttl: 604800,
    data: {
      defaultView: "",
      preferredLanguage: "",
      notificationSettings: {}
    }
  }
};
```

---

## 5. 开发路线图

### 5.1 第一阶段：MVP (4-6周)

**目标**: 实现基础的对话交互和核心 CRUD 操作

- [ ] **Week 1-2: 基础框架**
  - 搭建智能体服务架构
  - 实现与 BottleCRM API 的对接
  - 基础意图识别 (规则+简单 NLP)
  - 用户认证和会话管理

- [ ] **Week 3-4: 核心功能**
  - 查询类意图实现 (线索、账户、联系人、任务)
  - 创建类意图实现 (线索、任务)
  - 基础实体提取
  - 简单的槽位填充

- [ ] **Week 5-6: 优化完善**
  - 对话上下文管理
  - 错误处理和友好提示
  - Web 聊天界面
  - 基础测试和 bug 修复

**交付物**:
- 可通过对话查询和创建基础记录
- Web 端聊天界面
- API 文档

---

### 5.2 第二阶段：智能增强 (6-8周)

**目标**: 引入 LLM，实现智能理解和推荐

- [ ] **Week 7-10: LLM 集成**
  - 集成 GPT-4/Claude 进行意图识别
  - 实现复杂的槽位填充
  - 多轮对话管理优化
  - Function Calling 实现

- [ ] **Week 11-14: 智能分析**
  - 销售漏斗分析
  - 工作负载分析
  - 跟进推荐引擎
  - 数据可视化生成

**交付物**:
- 智能对话体验
- 数据分析功能
- 智能推荐功能

---

### 5.3 第三阶段：企业级功能 (4-6周)

**目标**: 支持多渠道、企业级场景

- [ ] **Week 15-18: 多渠道集成**
  - 企业微信机器人
  - 钉钉机器人
  - Slack 集成
  - 移动端 App

- [ ] **Week 19-20: 高级功能**
  - 批量操作支持
  - 自动化工作流触发
  - 报表生成和导出
  - 权限精细化控制

**交付物**:
- 多渠道接入能力
- 企业级功能
- 完整的管理后台

---

## 6. 指标与评估

### 6.1 核心指标

| 指标类别 | 具体指标 | 目标值 |
|----------|----------|--------|
| **准确率** | 意图识别准确率 | > 90% |
| | 实体提取准确率 | > 85% |
| | 任务完成成功率 | > 80% |
| **效率** | 平均响应时间 | < 2s |
| | 对话轮次/任务 | < 3 轮 |
| **满意度** | 用户满意度评分 | > 4.0/5.0 |
| | 任务重做率 | < 15% |
| **使用率** | 日活用户数 | 持续增长 |
| | 功能使用分布 | 均衡使用 |

### 6.2 A/B 测试方案

**测试组设置**:
- 对照组: 传统表单操作
- 实验组 A: 规则智能体
- 实验组 B: LLM 智能体

**测试指标**:
- 任务完成时间
- 错误率
- 用户满意度
- 功能使用频率

---

## 7. 安全与隐私

### 7.1 数据安全

- **令牌管理**: JWT 令牌安全存储，定期刷新
- **敏感信息**: 电话、地址等敏感数据脱敏处理
- **访问控制**: 基于角色的权限验证
- **审计日志**: 记录所有智能体操作

### 7.2 隐私保护

- **数据最小化**: 只收集必要的对话数据
- **用户同意**: 明确的隐私政策和用户同意
- **数据隔离**: 不同组织数据完全隔离
- **合规性**: 符合 GDPR、个人信息保护法等法规

### 7.3 提示注入防护

```python
def validate_user_input(user_input):
    # 检测潜在的提示注入攻击
    injection_patterns = [
        r"忽略.*指令",
        r"forget.*previous",
        r"system.*prompt",
        r"<.*>.*</.*>"
    ]

    for pattern in injection_patterns:
        if re.search(pattern, user_input, re.IGNORECASE):
            return False, "检测到不当输入，请重新表述"

    return True, user_input
```

---

## 8. 成本估算

### 8.1 开发成本

| 阶段 | 开发周期 | 人力投入 |
|------|----------|----------|
| MVP | 4-6周 | 2名全栈工程师 |
| 智能增强 | 6-8周 | +1名 AI工程师 |
| 企业功能 | 4-6周 | +1名前端工程师 |

### 8.2 运营成本 (月度)

| 项目 | 说明 |
|------|------|
| API 调用 | LLM API 费用 (按实际使用) |
| 服务器 | 云服务器 + Redis + 负载均衡 |
| 存储 | 对话历史存储 + 备份 |
| 监控 | 日志分析 + 性能监控 |

---

## 9. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| LLM 幻觉 | 数据错误 | 严格的数据验证，API 结果确认 |
| API 变更 | 功能失效 | 版本锁定，适配层抽象 |
| 性能问题 | 用户体验差 | 缓存优化，异步处理 |
| 安全漏洞 | 数据泄露 | 安全审计，渗透测试 |
| 用户接受度低 | 推广困难 | 渐进式推广，用户培训 |

---

## 10. 附录

### 10.1 API 映射表

| 智能体功能 | BottleCRM API | 请求频率 |
|-----------|---------------|----------|
| 用户认证 | POST /auth/login, /auth/register | 低 |
| 获取仪表板 | GET /dashboard, /dashboard/metrics | 高 |
| 线索 CRUD | GET/POST /leads, GET /leads/{id} | 高 |
| 账户 CRUD | GET/POST /accounts | 中 |
| 联系人 CRUD | GET/POST /contacts, GET /contacts/{id} | 高 |
| 机会 CRUD | GET/POST /opportunities | 中 |
| 任务管理 | GET/POST/PUT/DELETE /tasks | 高 |
| 组织管理 | GET/POST /organizations | 低 |

### 10.2 对话示例集

详见 3.3 节对话示例

### 10.3 技术栈清单

- **后端**: Node.js / Python
- **NLU**: RASA / LangChain
- **LLM**: OpenAI GPT-4 / Anthropic Claude
- **缓存**: Redis
- **消息队列**: RabbitMQ
- **前端**: React / Vue.js
- **移动端**: React Native / Flutter
- **集成**: 企业微信/钉钉/Slack SDK
