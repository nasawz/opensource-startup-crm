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
 * /leads/metadata:
 *   get:
 *     summary: Get leads metadata (enums, options, etc.)
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Leads metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leadStatuses:
 *                   type: array
 *                   items:
 *                     type: string
 *                 leadSources:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: string
 *                 industries:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/metadata', async (req, res) => {
  try {
    const metadata = {
      leadStatuses: [
        'NEW',
        'PENDING', 
        'CONTACTED',
        'QUALIFIED',
        'UNQUALIFIED',
        'CONVERTED'
      ],
      leadSources: [
        'WEB',
        'PHONE_INQUIRY',
        'PARTNER_REFERRAL', 
        'COLD_CALL',
        'TRADE_SHOW',
        'EMPLOYEE_REFERRAL',
        'ADVERTISEMENT',
        'OTHER'
      ],
      ratings: [
        'Hot',
        'Warm', 
        'Cold'
      ],
      industries: [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Manufacturing',
        'Retail',
        'Real Estate',
        'Consulting',
        'Media',
        'Transportation',
        'Energy',
        'Government',
        'Non-profit',
        'Other'
      ]
    };

    res.json(metadata);
  } catch (error) {
    console.error('Get leads metadata error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         company:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *           enum: [NEW, PENDING, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED]
 *         leadSource:
 *           type: string
 *           enum: [WEB, PHONE_INQUIRY, PARTNER_REFERRAL, COLD_CALL, TRADE_SHOW, EMPLOYEE_REFERRAL, ADVERTISEMENT, OTHER]
 *         industry:
 *           type: string
 *         rating:
 *           type: string
 *           enum: [Hot, Warm, Cold]
 *         description:
 *           type: string
 *         isConverted:
 *           type: boolean
 *         convertedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads for organization
 *     tags: [Leads]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or company
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, PENDING, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED]
 *         description: Filter by lead status
 *       - in: query
 *         name: leadSource
 *         schema:
 *           type: string
 *           enum: [WEB, PHONE_INQUIRY, PARTNER_REFERRAL, COLD_CALL, TRADE_SHOW, EMPLOYEE_REFERRAL, ADVERTISEMENT, OTHER]
 *         description: Filter by lead source
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           enum: [Hot, Warm, Cold]
 *         description: Filter by rating
 *       - in: query
 *         name: converted
 *         schema:
 *           type: boolean
 *         description: Filter by conversion status
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { 
      search, 
      status, 
      leadSource, 
      industry, 
      rating, 
      converted 
    } = req.query;

    // Build where clause for filtering
    let whereClause = { 
      organizationId: req.organizationId 
    };

    // Add search filter (search in firstName, lastName, email, company)
    if (search) {
      whereClause.OR = [
        { 
          firstName: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        { 
          lastName: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        { 
          email: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        },
        { 
          company: { 
            contains: search, 
            mode: 'insensitive' 
          } 
        }
      ];
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    // Add leadSource filter
    if (leadSource) {
      whereClause.leadSource = leadSource;
    }

    // Add industry filter
    if (industry) {
      whereClause.industry = {
        contains: industry,
        mode: 'insensitive'
      };
    }

    // Add rating filter
    if (rating) {
      whereClause.rating = rating;
    }

    // Add converted filter
    if (converted !== undefined) {
      whereClause.isConverted = converted === 'true';
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.lead.count({
        where: whereClause
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found
 */
router.get('/:id', async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
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
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NEW, PENDING, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED]
 *               leadSource:
 *                 type: string
 *                 enum: [WEB, PHONE_INQUIRY, PARTNER_REFERRAL, COLD_CALL, TRADE_SHOW, EMPLOYEE_REFERRAL, ADVERTISEMENT, OTHER]
 *               industry:
 *                 type: string
 *               rating:
 *                 type: string
 *                 enum: [Hot, Warm, Cold]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      title,
      status, 
      leadSource,
      industry,
      rating,
      description
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate status if provided
    const validStatuses = ['NEW', 'PENDING', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Validate leadSource if provided
    const validSources = ['WEB', 'PHONE_INQUIRY', 'PARTNER_REFERRAL', 'COLD_CALL', 'TRADE_SHOW', 'EMPLOYEE_REFERRAL', 'ADVERTISEMENT', 'OTHER'];
    if (leadSource && !validSources.includes(leadSource)) {
      return res.status(400).json({ error: 'Invalid lead source value' });
    }

    // Validate rating if provided
    const validRatings = ['Hot', 'Warm', 'Cold'];
    if (rating && !validRatings.includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating value' });
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        title: title?.trim() || null,
        status: status || 'PENDING',
        leadSource: leadSource || null,
        industry: industry?.trim() || null,
        rating: rating || null,
        description: description?.trim() || null,
        organizationId: req.organizationId,
        ownerId: req.userId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A lead with this email already exists in this organization' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;