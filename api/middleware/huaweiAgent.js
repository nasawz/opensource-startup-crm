import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 华为小艺智能体 API Key 认证中间件
 * 使用 Header 方式传递认证信息
 * 
 * 配置说明：
 * - 在华为开发者联盟后台配置账号授权服务时选择 "Header" 认证方式
 * - 配置 Header 域传递参数的 key 和 value
 * - 环境变量配置：
 *   - HUAWEI_AGENT_API_KEY: 配置的 key 名称（如 X-Agent-Api-Key）
 *   - HUAWEI_AGENT_API_SECRET: 配置的 value 值
 */
export const verifyHuaweiAgentApiKey = (req, res, next) => {
  try {
    const apiKeyHeader = process.env.HUAWEI_AGENT_API_KEY || 'X-Agent-Api-Key';
    const apiSecret = process.env.HUAWEI_AGENT_API_SECRET;

    if (!apiSecret) {
      console.error('HUAWEI_AGENT_API_SECRET is not configured');
      return res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: 'Server configuration error'
        }
      });
    }

    const providedKey = req.header(apiKeyHeader);

    if (!providedKey) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32001,
          message: 'Missing API key'
        }
      });
    }

    if (providedKey !== apiSecret) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32002,
          message: 'Invalid API key'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Huawei agent API key verification error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal server error'
      }
    });
  }
};

/**
 * 验证华为智能体会话
 * 从 agent-session-id header 获取会话ID并验证
 */
export const verifyHuaweiAgentSession = async (req, res, next) => {
  try {
    const agentSessionId = req.header('agent-session-id');

    if (!agentSessionId) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32003,
          message: 'Missing agent-session-id header'
        }
      });
    }

    // 查找有效的会话
    const session = await prisma.huaweiAgentSession.findFirst({
      where: {
        agentLoginSessionId: agentSessionId,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            organizations: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32004,
          message: 'Invalid or expired session'
        }
      });
    }

    // 更新最后使用时间
    await prisma.huaweiAgentSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() }
    });

    // 将用户信息附加到请求对象
    req.user = session.user;
    req.userId = session.user.id;
    req.agentSession = session;
    req.huaweiOpenId = session.huaweiOpenId;

    next();
  } catch (error) {
    console.error('Huawei agent session verification error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal server error'
      }
    });
  }
};

/**
 * 可选的会话验证中间件
 * 如果提供了 agentLoginSessionId，则验证；否则跳过
 */
export const optionalHuaweiAgentSession = async (req, res, next) => {
  try {
    // 从请求体中获取 agentLoginSessionId（用于 authorize 后的请求）
    const agentLoginSessionId = req.body?.params?.message?.parts?.[0]?.data?.agentLoginSessionId;
    
    if (!agentLoginSessionId) {
      return next();
    }

    // 查找有效的会话
    const session = await prisma.huaweiAgentSession.findFirst({
      where: {
        agentLoginSessionId,
        isRevoked: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            organizations: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (session) {
      req.user = session.user;
      req.userId = session.user.id;
      req.agentSession = session;
      req.huaweiOpenId = session.huaweiOpenId;
    }

    next();
  } catch (error) {
    console.error('Optional Huawei agent session verification error:', error);
    next();
  }
};
