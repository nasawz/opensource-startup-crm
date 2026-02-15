import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, requireOrganization } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardMetrics:
 *       type: object
 *       properties:
 *         totalLeads:
 *           type: integer
 *           description: Number of active leads
 *         totalOpportunities:
 *           type: integer
 *           description: Number of open opportunities
 *         totalAccounts:
 *           type: integer
 *           description: Number of active accounts
 *         totalContacts:
 *           type: integer
 *           description: Number of contacts
 *         pendingTasks:
 *           type: integer
 *           description: Number of pending tasks for the user
 *         opportunityRevenue:
 *           type: number
 *           description: Total pipeline value
 *     DashboardRecentData:
 *       type: object
 *       properties:
 *         leads:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               status:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         opportunities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               account:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         tasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               subject:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *         activities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               action:
 *                 type: string
 *               entityType:
 *                 type: string
 *               description:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               user:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         metrics:
 *           $ref: '#/components/schemas/DashboardMetrics'
 *         recentData:
 *           $ref: '#/components/schemas/DashboardRecentData'
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard data with metrics and recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       400:
 *         description: Missing organization ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied to organization
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyAuth, requireOrganization, async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;

    // Fetch dashboard metrics - parallel execution for performance
    const [
      totalLeads,
      totalOpportunities,
      totalAccounts,
      totalContacts,
      pendingTasks,
      recentLeads,
      recentOpportunities,
      upcomingTasks,
      recentActivities
    ] = await Promise.all([
      // Count metrics
      prisma.lead.count({
        where: { organizationId, isConverted: false }
      }),
      prisma.opportunity.count({
        where: { organizationId, stage: { not: 'CLOSED_WON' } }
      }),
      prisma.account.count({
        where: { organizationId, isActive: true }
      }),
      prisma.contact.count({
        where: { organizationId }
      }),
      prisma.task.count({
        where: { 
          organizationId,
          status: { not: 'Completed' },
          ownerId: userId
        }
      }),

      // Recent data
      prisma.lead.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.opportunity.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          account: {
            select: { name: true }
          }
        }
      }),
      prisma.task.findMany({
        where: { 
          organizationId,
          ownerId: userId,
          status: { not: 'Completed' },
          dueDate: { gte: new Date() }
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          dueDate: true
        }
      }),
      prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          user: {
            select: { name: true }
          }
        }
      })
    ]);

    // Calculate opportunity revenue
    const opportunityRevenue = await prisma.opportunity.aggregate({
      where: { organizationId },
      _sum: { amount: true }
    });

    const response = {
      success: true,
      metrics: {
        totalLeads,
        totalOpportunities,
        totalAccounts,
        totalContacts,
        pendingTasks,
        opportunityRevenue: opportunityRevenue._sum.amount || 0
      },
      recentData: {
        leads: recentLeads,
        opportunities: recentOpportunities,
        tasks: upcomingTasks,
        activities: recentActivities
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load dashboard data' 
    });
  }
});

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics only (lightweight endpoint)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 metrics:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *       400:
 *         description: Missing organization ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied to organization
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', verifyAuth, requireOrganization, async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;

    // Fetch only metrics for lightweight response
    const [
      totalLeads,
      totalOpportunities,
      totalAccounts,
      totalContacts,
      pendingTasks,
      opportunityRevenue
    ] = await Promise.all([
      prisma.lead.count({
        where: { organizationId, isConverted: false }
      }),
      prisma.opportunity.count({
        where: { organizationId, stage: { not: 'CLOSED_WON' } }
      }),
      prisma.account.count({
        where: { organizationId, isActive: true }
      }),
      prisma.contact.count({
        where: { organizationId }
      }),
      prisma.task.count({
        where: { 
          organizationId,
          status: { not: 'Completed' },
          ownerId: userId
        }
      }),
      prisma.opportunity.aggregate({
        where: { organizationId },
        _sum: { amount: true }
      })
    ]);

    const response = {
      success: true,
      metrics: {
        totalLeads,
        totalOpportunities,
        totalAccounts,
        totalContacts,
        pendingTasks,
        opportunityRevenue: opportunityRevenue._sum.amount || 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard metrics API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load dashboard metrics' 
    });
  }
});

export default router;