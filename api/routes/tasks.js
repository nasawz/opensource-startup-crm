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
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         subject:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Not Started, In Progress, Completed, Deferred, Waiting]
 *         priority:
 *           type: string
 *           enum: [High, Normal, Low]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks for organization
 *     tags: [Tasks]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter tasks by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter tasks by priority
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         description: Filter tasks by owner ID
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter tasks by account ID
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         description: Filter tasks by contact ID
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter tasks by lead ID
 *       - in: query
 *         name: opportunityId
 *         schema:
 *           type: string
 *         description: Filter tasks by opportunity ID
 *       - in: query
 *         name: caseId
 *         schema:
 *           type: string
 *         description: Filter tasks by case ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      ownerId, 
      accountId, 
      contactId, 
      leadId, 
      opportunityId, 
      caseId,
      limit = 50,
      offset = 0
    } = req.query;

    // Build where clause for filtering
    const where = {
      organizationId: req.organizationId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(ownerId && { ownerId }),
      ...(accountId && { accountId }),
      ...(contactId && { contactId }),
      ...(leadId && { leadId }),
      ...(opportunityId && { opportunityId }),
      ...(caseId && { caseId })
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        account: {
          select: { id: true, name: true, type: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, company: true }
        },
        opportunity: {
          select: { id: true, name: true, amount: true, status: true }
        },
        case: {
          select: { id: true, caseNumber: true, subject: true, status: true }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.task.count({ where });

    res.json({ 
      tasks,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *               - subject
 *             properties:
 *               subject:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Not Started, In Progress, Completed, Deferred, Waiting]
 *                 default: Not Started
 *               priority:
 *                 type: string
 *                 enum: [High, Normal, Low]
 *                 default: Normal
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               ownerId:
 *                 type: string
 *                 description: UUID of the user who owns this task
 *               accountId:
 *                 type: string
 *                 description: UUID of the related account
 *               contactId:
 *                 type: string
 *                 description: UUID of the related contact
 *               leadId:
 *                 type: string
 *                 description: UUID of the related lead
 *               opportunityId:
 *                 type: string
 *                 description: UUID of the related opportunity
 *               caseId:
 *                 type: string
 *                 description: UUID of the related case
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res) => {
  try {
    const { 
      subject, 
      status = 'Not Started', 
      priority = 'Normal', 
      dueDate, 
      description,
      ownerId,
      accountId,
      contactId,
      leadId,
      opportunityId,
      caseId
    } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    // Validate status
    const validStatuses = ['Not Started', 'In Progress', 'Completed', 'Deferred', 'Waiting'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid options: ' + validStatuses.join(', ') });
    }

    // Validate priority
    const validPriorities = ['High', 'Normal', 'Low'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Valid options: ' + validPriorities.join(', ') });
    }

    // Validate owner exists in organization
    let owner = null;
    const finalOwnerId = ownerId || req.userId; // Default to current user if no owner specified
    
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: finalOwnerId,
        organizationId: req.organizationId
      },
      include: {
        user: true
      }
    });

    if (!userOrg) {
      return res.status(400).json({ error: 'Owner must be a member of this organization' });
    }

    // Validate related entities if provided
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

    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          organizationId: req.organizationId
        }
      });
      if (!contact) {
        return res.status(400).json({ error: 'Contact not found in your organization' });
      }
    }

    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          organizationId: req.organizationId
        }
      });
      if (!lead) {
        return res.status(400).json({ error: 'Lead not found in your organization' });
      }
    }

    if (opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: {
          id: opportunityId,
          organizationId: req.organizationId
        }
      });
      if (!opportunity) {
        return res.status(400).json({ error: 'Opportunity not found in your organization' });
      }
    }

    if (caseId) {
      const caseRecord = await prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId: req.organizationId
        }
      });
      if (!caseRecord) {
        return res.status(400).json({ error: 'Case not found in your organization' });
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        subject,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        description: description || null,
        ownerId: finalOwnerId,
        createdById: req.userId,
        organizationId: req.organizationId,
        accountId: accountId || null,
        contactId: contactId || null,
        leadId: leadId || null,
        opportunityId: opportunityId || null,
        caseId: caseId || null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        account: {
          select: { id: true, name: true, type: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, company: true }
        },
        opportunity: {
          select: { id: true, name: true, amount: true, status: true }
        },
        case: {
          select: { id: true, caseNumber: true, subject: true, status: true }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a specific task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        account: {
          select: { id: true, name: true, type: true, website: true, phone: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true }
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true, status: true }
        },
        opportunity: {
          select: { id: true, name: true, amount: true, status: true, stage: true, closeDate: true }
        },
        case: {
          select: { id: true, caseNumber: true, subject: true, status: true, priority: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a specific task
 *     tags: [Tasks]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Not Started, In Progress, Completed, Deferred, Waiting]
 *               priority:
 *                 type: string
 *                 enum: [High, Normal, Low]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               ownerId:
 *                 type: string
 *                 description: UUID of the user who owns this task
 *               accountId:
 *                 type: string
 *                 description: UUID of the related account
 *               contactId:
 *                 type: string
 *                 description: UUID of the related contact
 *               leadId:
 *                 type: string
 *                 description: UUID of the related lead
 *               opportunityId:
 *                 type: string
 *                 description: UUID of the related opportunity
 *               caseId:
 *                 type: string
 *                 description: UUID of the related case
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      subject, 
      status, 
      priority, 
      dueDate, 
      description,
      ownerId,
      accountId,
      contactId,
      leadId,
      opportunityId,
      caseId
    } = req.body;

    // Check if task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['Not Started', 'In Progress', 'Completed', 'Deferred', 'Waiting'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Valid options: ' + validStatuses.join(', ') });
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['High', 'Normal', 'Low'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority. Valid options: ' + validPriorities.join(', ') });
      }
    }

    // Validate owner exists in organization if provided
    if (ownerId) {
      const userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: ownerId,
          organizationId: req.organizationId
        }
      });

      if (!userOrg) {
        return res.status(400).json({ error: 'Owner must be a member of this organization' });
      }
    }

    // Validate related entities if provided
    if (accountId !== undefined) {
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
    }

    if (contactId !== undefined) {
      if (contactId) {
        const contact = await prisma.contact.findFirst({
          where: {
            id: contactId,
            organizationId: req.organizationId
          }
        });
        if (!contact) {
          return res.status(400).json({ error: 'Contact not found in your organization' });
        }
      }
    }

    if (leadId !== undefined) {
      if (leadId) {
        const lead = await prisma.lead.findFirst({
          where: {
            id: leadId,
            organizationId: req.organizationId
          }
        });
        if (!lead) {
          return res.status(400).json({ error: 'Lead not found in your organization' });
        }
      }
    }

    if (opportunityId !== undefined) {
      if (opportunityId) {
        const opportunity = await prisma.opportunity.findFirst({
          where: {
            id: opportunityId,
            organizationId: req.organizationId
          }
        });
        if (!opportunity) {
          return res.status(400).json({ error: 'Opportunity not found in your organization' });
        }
      }
    }

    if (caseId !== undefined) {
      if (caseId) {
        const caseRecord = await prisma.case.findFirst({
          where: {
            id: caseId,
            organizationId: req.organizationId
          }
        });
        if (!caseRecord) {
          return res.status(400).json({ error: 'Case not found in your organization' });
        }
      }
    }

    // Build update data object
    const updateData = {};
    if (subject !== undefined) updateData.subject = subject;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (description !== undefined) updateData.description = description;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (accountId !== undefined) updateData.accountId = accountId;
    if (contactId !== undefined) updateData.contactId = contactId;
    if (leadId !== undefined) updateData.leadId = leadId;
    if (opportunityId !== undefined) updateData.opportunityId = opportunityId;
    if (caseId !== undefined) updateData.caseId = caseId;

    // Update the task
    const task = await prisma.task.update({
      where: { id: id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        account: {
          select: { id: true, name: true, type: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, company: true }
        },
        opportunity: {
          select: { id: true, name: true, amount: true, status: true }
        },
        case: {
          select: { id: true, caseNumber: true, subject: true, status: true }
        }
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a specific task
 *     tags: [Tasks]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task (this will also cascade delete related comments due to schema relationship)
    await prisma.task.delete({
      where: { id: id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       404:
 *         description: Task not found
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { body, isPrivate = false } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    // Check if task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        body,
        isPrivate,
        authorId: req.userId,
        organizationId: req.organizationId,
        taskId: id
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
