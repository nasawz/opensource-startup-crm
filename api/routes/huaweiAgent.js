import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { verifyHuaweiAgentApiKey } from '../middleware/huaweiAgent.js';

const router = express.Router();
const prisma = new PrismaClient();

// 华为账号授权码换取手机号的配置
const HUAWEI_TOKEN_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';
const HUAWEI_USERINFO_URL = 'https://account.cloud.huawei.com/rest.php?nsp_svc=GOpen.User.getInfo';

/**
 * 使用华为授权码获取用户信息（手机号）
 * @param {string} authCode - 华为账号授权码
 * @returns {Promise<{openId: string, unionId?: string, phone?: string}>}
 */
async function getHuaweiUserInfo(authCode) {
  const clientId = process.env.HUAWEI_APP_ID;
  const clientSecret = process.env.HUAWEI_APP_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('HUAWEI_APP_ID or HUAWEI_APP_SECRET not configured');
  }

  // 1. 使用授权码换取 access_token
  const tokenResponse = await fetch(HUAWEI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: process.env.HUAWEI_REDIRECT_URI || ''
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Huawei token exchange failed:', errorText);
    throw new Error('Failed to exchange authorization code');
  }

  const tokenData = await tokenResponse.json();
  const { access_token, open_id, union_id } = tokenData;

  // 2. 使用 access_token 获取用户信息（包括手机号）
  let phone = null;
  try {
    const userInfoResponse = await fetch(HUAWEI_USERINFO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${access_token}`
      },
      body: new URLSearchParams({
        nsp_ts: Math.floor(Date.now() / 1000).toString(),
        access_token: access_token,
        getNickName: '1'
      })
    });

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      phone = userInfo.mobileNumber || userInfo.phone || null;
    }
  } catch (error) {
    console.warn('Failed to get Huawei user info:', error.message);
  }

  return {
    openId: open_id,
    unionId: union_id,
    phone,
    accessToken: access_token
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     HuaweiAuthorizeRequest:
 *       type: object
 *       required:
 *         - jsonrpc
 *         - id
 *         - method
 *         - params
 *       properties:
 *         jsonrpc:
 *           type: string
 *           example: "2.0"
 *         id:
 *           type: string
 *           description: 全局唯一消息序列号
 *         method:
 *           type: string
 *           enum: [authorize]
 *         params:
 *           type: object
 *           properties:
 *             message:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: "user"
 *                 parts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kind:
 *                         type: string
 *                         example: "data"
 *                       data:
 *                         type: object
 *                         properties:
 *                           authCode:
 *                             type: string
 *                             description: 华为账号授权码
 *     HuaweiAuthorizeResponse:
 *       type: object
 *       properties:
 *         jsonrpc:
 *           type: string
 *           example: "2.0"
 *         id:
 *           type: string
 *         result:
 *           type: object
 *           properties:
 *             version:
 *               type: string
 *               example: "1.0"
 *             agentLoginSessionId:
 *               type: string
 *               description: 用户登录凭证唯一ID
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *             message:
 *               type: string
 */

/**
 * @swagger
 * /agent/message:
 *   post:
 *     summary: 华为小艺智能体消息入口（授权/解除授权）
 *     description: |
 *       处理小艺APP发送的授权和解除授权请求。
 *       - method=authorize: 用户授权，返回 agentLoginSessionId
 *       - method=deauthorize: 解除授权
 *     tags: [Huawei Agent]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: agent-session-id
 *         schema:
 *           type: string
 *         description: 智能体会话ID（可选，用于已登录用户）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HuaweiAuthorizeRequest'
 *     responses:
 *       200:
 *         description: 操作成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HuaweiAuthorizeResponse'
 *       401:
 *         description: 认证失败
 *       500:
 *         description: 服务器错误
 */
router.post('/message', verifyHuaweiAgentApiKey, async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  // 验证 JSON-RPC 格式
  if (jsonrpc !== '2.0') {
    return res.json({
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid JSON-RPC version'
      }
    });
  }

  try {
    switch (method) {
      case 'authorize':
        return await handleAuthorize(req, res, id, params);
      case 'deauthorize':
        return await handleDeauthorize(req, res, id, params);
      default:
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        });
    }
  } catch (error) {
    console.error('Huawei agent message error:', error);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message || 'Internal server error'
      }
    });
  }
});

/**
 * 处理授权请求
 * 使用华为授权码注册/登录用户，返回 agentLoginSessionId
 */
async function handleAuthorize(req, res, id, params) {
  const authCode = params?.message?.parts?.[0]?.data?.authCode;

  if (!authCode) {
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32602,
        message: 'Missing authCode parameter'
      }
    });
  }

  try {
    // 1. 使用授权码获取华为用户信息
    const huaweiUser = await getHuaweiUserInfo(authCode);
    const { openId, unionId, phone } = huaweiUser;

    if (!openId) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32001,
          message: 'Failed to get Huawei user information'
        }
      });
    }

    // 2. 查找或创建用户
    let user = await prisma.user.findFirst({
      where: { huaweiOpenId: openId }
    });

    if (!user) {
      // 创建新用户
      const userId = uuidv4();
      // 生成一个基于华为账号的邮箱占位符
      const placeholderEmail = `huawei_${openId}@agent.bottlecrm.com`;
      
      user = await prisma.user.create({
        data: {
          user_id: userId,
          email: placeholderEmail,
          name: phone ? `用户${phone.slice(-4)}` : `华为用户`,
          huaweiOpenId: openId,
          huaweiUnionId: unionId,
          huaweiPhone: phone,
          phone: phone,
          lastLogin: new Date()
        }
      });

      console.log(`Created new user from Huawei account: ${user.id}`);
    } else {
      // 更新现有用户信息
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          huaweiUnionId: unionId,
          huaweiPhone: phone || user.huaweiPhone,
          phone: phone || user.phone,
          lastLogin: new Date()
        }
      });
    }

    // 3. 撤销该用户之前的智能体会话（可选，根据业务需求）
    await prisma.huaweiAgentSession.updateMany({
      where: {
        userId: user.id,
        isRevoked: false
      },
      data: {
        isRevoked: true,
        updatedAt: new Date()
      }
    });

    // 4. 创建新的智能体会话
    const sessionExpiresIn = parseInt(process.env.HUAWEI_SESSION_EXPIRES_HOURS || '168'); // 默认7天
    const expiresAt = new Date(Date.now() + sessionExpiresIn * 60 * 60 * 1000);
    const agentLoginSessionId = uuidv4();

    await prisma.huaweiAgentSession.create({
      data: {
        agentLoginSessionId,
        userId: user.id,
        huaweiOpenId: openId,
        expiresAt,
        deviceInfo: req.get('User-Agent'),
        ipAddress: req.ip || req.socket?.remoteAddress
      }
    });

    // 5. 返回成功响应
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        version: '1.0',
        agentLoginSessionId
      },
      error: {
        code: 0,
        message: 'success'
      }
    });

  } catch (error) {
    console.error('Authorize error:', error);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message || 'Authorization failed'
      }
    });
  }
}

/**
 * 处理解除授权请求
 */
async function handleDeauthorize(req, res, id, params) {
  const data = params?.message?.parts?.[0]?.data;
  const agentLoginSessionId = data?.agentLoginSessionId;
  const cpUserId = data?.cpUserId;

  if (!agentLoginSessionId) {
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32602,
        message: 'Missing agentLoginSessionId parameter'
      }
    });
  }

  try {
    // 查找并撤销会话
    const session = await prisma.huaweiAgentSession.findFirst({
      where: { agentLoginSessionId }
    });

    if (session) {
      await prisma.huaweiAgentSession.update({
        where: { id: session.id },
        data: {
          isRevoked: true,
          updatedAt: new Date()
        }
      });

      // 如果提供了 cpUserId，可以记录日志或执行其他清理操作
      if (cpUserId) {
        console.log(`Deauthorized session for cpUserId: ${cpUserId}`);
      }
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        version: '1.0'
      },
      error: {
        code: 0,
        message: 'success'
      }
    });

  } catch (error) {
    console.error('Deauthorize error:', error);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message || 'Deauthorization failed'
      }
    });
  }
}

/**
 * @swagger
 * /agent/auth/huawei:
 *   post:
 *     summary: 使用华为授权码登录/注册
 *     description: |
 *       使用华为账号授权码进行登录或注册。
 *       如果用户不存在，会自动创建新用户。
 *       返回标准的 JWT token 用于后续 API 调用。
 *     tags: [Huawei Agent]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authCode
 *             properties:
 *               authCode:
 *                 type: string
 *                 description: 华为账号授权码
 *     responses:
 *       200:
 *         description: 登录/注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 JWTtoken:
 *                   type: string
 *                 user:
 *                   type: object
 *                 organizations:
 *                   type: array
 *                 isNewUser:
 *                   type: boolean
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/auth/huawei', async (req, res) => {
  try {
    const { authCode } = req.body;

    if (!authCode) {
      return res.status(400).json({
        error: '缺少 authCode 参数'
      });
    }

    // 使用授权码获取华为用户信息
    const huaweiUser = await getHuaweiUserInfo(authCode);
    const { openId, unionId, phone } = huaweiUser;

    if (!openId) {
      return res.status(400).json({
        error: '无法获取华为账号信息'
      });
    }

    // 查找或创建用户
    let user = await prisma.user.findFirst({
      where: { huaweiOpenId: openId },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    let isNewUser = false;

    if (!user) {
      // 创建新用户
      isNewUser = true;
      const userId = uuidv4();
      const placeholderEmail = `huawei_${openId}@agent.bottlecrm.com`;
      
      user = await prisma.user.create({
        data: {
          user_id: userId,
          email: placeholderEmail,
          name: phone ? `用户${phone.slice(-4)}` : `华为用户`,
          huaweiOpenId: openId,
          huaweiUnionId: unionId,
          huaweiPhone: phone,
          phone: phone,
          lastLogin: new Date()
        },
        include: {
          organizations: {
            include: {
              organization: true
            }
          }
        }
      });
    } else {
      // 更新现有用户
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          huaweiUnionId: unionId,
          huaweiPhone: phone || user.huaweiPhone,
          phone: phone || user.phone,
          lastLogin: new Date()
        },
        include: {
          organizations: {
            include: {
              organization: true
            }
          }
        }
      });
    }

    // 创建 JWT token
    const jwt = await import('jsonwebtoken');
    const JWTtoken = jwt.default.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 计算过期时间
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const expirationHours = expiresIn.includes('h') ? parseInt(expiresIn) : 24;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    // 存储 JWT token
    await prisma.jwtToken.create({
      data: {
        token: JWTtoken,
        userId: user.id,
        expiresAt: expiresAt,
        deviceInfo: req.get('User-Agent'),
        ipAddress: req.ip || req.socket?.remoteAddress
      }
    });

    // 返回响应
    res.json({
      success: true,
      JWTtoken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profileImage: user.profilePhoto,
        huaweiOpenId: user.huaweiOpenId
      },
      organizations: user.organizations.map(uo => ({
        id: uo.organization.id,
        name: uo.organization.name,
        role: uo.role
      })),
      isNewUser
    });

  } catch (error) {
    console.error('Huawei auth error:', error);
    res.status(500).json({
      error: error.message || '华为账号登录失败'
    });
  }
});

export default router;
