import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, requireOrganization } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 使用 verifyAuth 同时支持 JWT Token 和华为智能体会话认证
router.use(verifyAuth);
router.use(requireOrganization);

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         industry:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         website:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts for organization
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of accounts
 */
router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { name, industry, phone, email, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    const account = await prisma.account.create({
      data: {
        name,
        industry,
        phone,
        email,
        website,
        organizationId: req.organizationId,
        ownerId: req.userId
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;