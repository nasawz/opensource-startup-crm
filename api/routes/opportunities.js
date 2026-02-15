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
 * /opportunities:
 *   get:
 *     summary: Get all opportunities for organization
 *     tags: [Opportunities]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of opportunities
 */
router.get('/', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({ opportunities });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /opportunities:
 *   post:
 *     summary: Create a new opportunity
 *     tags: [Opportunities]
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
 *               - amount
 *               - closeDate
 *               - stage
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               closeDate:
 *                 type: string
 *                 format: date
 *               stage:
 *                 type: string
 *               accountId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Opportunity created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { name, amount, closeDate, stage, accountId } = req.body;

    if (!name || !amount || !closeDate || !stage) {
      return res.status(400).json({ error: 'Name, amount, close date, and stage are required' });
    }

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          organizationId: req.organizationId
        }
      });

      if (!account) {
        return res.status(400).json({ error: 'Account not found in your organization' });
      }
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        amount: parseFloat(amount),
        closeDate: new Date(closeDate),
        stage,
        accountId,
        organizationId: req.organizationId,
        ownerId: req.userId
      },
      include: {
        account: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;