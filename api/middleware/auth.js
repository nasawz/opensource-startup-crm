import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 验证 JWT Token
 * 仅支持标准的 Bearer Token 认证
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // First verify JWT signature and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token exists in database and is not revoked
    const dbToken = await prisma.jwtToken.findUnique({
      where: { token },
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

    if (!dbToken) {
      return res.status(401).json({ error: 'Invalid token. Token not found.' });
    }

    if (dbToken.isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked.' });
    }

    if (dbToken.expiresAt < new Date()) {
      // Mark token as expired in database
      await prisma.jwtToken.update({
        where: { id: dbToken.id },
        data: { isRevoked: true }
      });
      return res.status(401).json({ error: 'Token has expired.' });
    }

    if (!dbToken.user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    // Update last used timestamp
    await prisma.jwtToken.update({
      where: { id: dbToken.id },
      data: { lastUsedAt: new Date() }
    });

    req.user = dbToken.user;
    req.userId = dbToken.user.id;
    req.tokenId = dbToken.id;
    req.authType = 'jwt';
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token format.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Token validation failed.' });
  }
};

/**
 * 统一认证中间件
 * 同时支持 JWT Token 和华为智能体会话认证
 * 
 * 认证优先级：
 * 1. Authorization Header (Bearer Token) - 标准 JWT 认证
 * 2. agent-session-id Header - 华为智能体会话认证
 * 
 * 使用方式：
 * - 标准 API 调用: Authorization: Bearer <jwt-token>
 * - 华为智能体调用: agent-session-id: <agentLoginSessionId>
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const agentSessionId = req.header('agent-session-id');

    // 优先检查 JWT Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyToken(req, res, next);
    }

    // 检查华为智能体会话
    if (agentSessionId) {
      return verifyAgentSession(req, res, next, agentSessionId);
    }

    // 两种认证方式都没有提供
    return res.status(401).json({ 
      error: 'Access denied. No authentication provided.',
      hint: 'Provide either Authorization header (Bearer token) or agent-session-id header.'
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

/**
 * 验证华为智能体会话
 * @param {Request} req 
 * @param {Response} res 
 * @param {Function} next 
 * @param {string} agentSessionId 
 */
async function verifyAgentSession(req, res, next, agentSessionId) {
  try {
    // 可选：验证 API Key（如果配置了的话）
    const apiKeyHeader = process.env.HUAWEI_AGENT_API_KEY || 'X-Agent-Api-Key';
    const apiSecret = process.env.HUAWEI_AGENT_API_SECRET;
    
    if (apiSecret) {
      const providedKey = req.header(apiKeyHeader);
      if (providedKey && providedKey !== apiSecret) {
        return res.status(401).json({ error: 'Invalid API key.' });
      }
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
        error: 'Invalid or expired agent session.',
        code: 'AGENT_SESSION_INVALID'
      });
    }

    if (!session.user) {
      return res.status(401).json({ error: 'User not found for this session.' });
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
    req.agentSessionId = session.agentLoginSessionId;
    req.huaweiOpenId = session.huaweiOpenId;
    req.authType = 'huawei_agent';

    next();
  } catch (error) {
    console.error('Agent session verification error:', error);
    return res.status(401).json({ error: 'Agent session validation failed.' });
  }
}

export const requireOrganization = async (req, res, next) => {
  try {
    const organizationId = req.header('X-Organization-ID');
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required in X-Organization-ID header.' });
    }

    const userOrg = req.user.organizations.find(
      uo => uo.organizationId === organizationId
    );

    if (!userOrg) {
      return res.status(403).json({ error: 'Access denied to this organization.' });
    }

    req.organizationId = organizationId;
    req.userRole = userOrg.role;
    req.organization = userOrg.organization;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user.email.endsWith('@micropyramid.com')) {
    return res.status(403).json({ error: 'Super admin access required.' });
  }
  next();
};