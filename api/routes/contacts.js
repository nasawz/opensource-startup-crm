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
 * /contacts:
 *   get:
 *     summary: Get all contacts for organization
 *     tags: [Contacts]
 *     parameters:
 *       - in: header
 *         name: X-Organization-ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of contacts
 */
router.get('/', async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        relatedAccounts: {
          include: {
            account: {
              select: { id: true, name: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
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
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               accountId:
 *                 type: string
 *                 description: UUID of the account to associate with this contact
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, title, department, street, city, state, postalCode, country, description, accountId } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Validate account if provided
    let account = null;
    if (accountId) {
      account = await prisma.account.findFirst({
        where: {
          id: accountId,
          organizationId: req.organizationId
        }
      });

      if (!account) {
        return res.status(400).json({ error: 'Account not found in your organization' });
      }
    }

    // Check for duplicate email within the organization if email is provided
    if (email) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: email,
          organizationId: req.organizationId
        }
      });

      if (existingContact) {
        return res.status(400).json({ error: 'A contact with this email already exists in this organization' });
      }
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        title: title || null,
        department: department || null,
        street: street || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || null,
        description: description || null,
        organizationId: req.organizationId,
        ownerId: req.userId
      }
    });

    // Create account-contact relationship if accountId is provided
    if (accountId) {
      await prisma.accountContactRelationship.create({
        data: {
          accountId: accountId,
          contactId: contact.id,
          isPrimary: true
        }
      });
    }

    // Fetch the created contact with relationships
    const createdContact = await prisma.contact.findUnique({
      where: { id: contact.id },
      include: {
        relatedAccounts: {
          include: {
            account: {
              select: { id: true, name: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(createdContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a specific contact by ID
 *     tags: [Contacts]
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
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact details
 *       404:
 *         description: Contact not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      },
      include: {
        relatedAccounts: {
          include: {
            account: {
              select: { id: true, name: true, type: true, website: true, phone: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Update a contact
 *     tags: [Contacts]
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
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               accountId:
 *                 type: string
 *                 description: UUID of the account to associate with this contact
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Contact not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, title, department, street, city, state, postalCode, country, description, accountId } = req.body;

    // Check if contact exists and belongs to organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: id,
        organizationId: req.organizationId
      }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Validate firstName and lastName if provided
    if (firstName !== undefined && !firstName.trim()) {
      return res.status(400).json({ error: 'First name cannot be empty' });
    }
    if (lastName !== undefined && !lastName.trim()) {
      return res.status(400).json({ error: 'Last name cannot be empty' });
    }

    // Validate account if provided
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

    // Check for duplicate email if email is being changed
    if (email && email !== existingContact.email) {
      const duplicateContact = await prisma.contact.findFirst({
        where: {
          email: email,
          organizationId: req.organizationId,
          NOT: {
            id: id
          }
        }
      });

      if (duplicateContact) {
        return res.status(400).json({ error: 'A contact with this email already exists in this organization' });
      }
    }

    // Update the contact
    await prisma.contact.update({
      where: { id: id },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : undefined,
        lastName: lastName !== undefined ? lastName.trim() : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        title: title !== undefined ? (title ? title.trim() : null) : undefined,
        department: department !== undefined ? (department ? department.trim() : null) : undefined,
        street: street !== undefined ? (street ? street.trim() : null) : undefined,
        city: city !== undefined ? (city ? city.trim() : null) : undefined,
        state: state !== undefined ? (state ? state.trim() : null) : undefined,
        postalCode: postalCode !== undefined ? (postalCode ? postalCode.trim() : null) : undefined,
        country: country !== undefined ? (country ? country.trim() : null) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
      }
    });

    // Handle account relationship if accountId is provided
    if (accountId) {
      // Check if relationship exists
      const relationship = await prisma.accountContactRelationship.findFirst({
        where: {
          contactId: id,
          accountId: accountId
        }
      });

      if (!relationship) {
        // Create new relationship
        await prisma.accountContactRelationship.create({
          data: {
            accountId: accountId,
            contactId: id,
            isPrimary: true
          }
        });
      }
    }

    // Fetch the updated contact with relationships
    const updatedContact = await prisma.contact.findUnique({
      where: { id: id },
      include: {
        relatedAccounts: {
          include: {
            account: {
              select: { id: true, name: true, type: true, website: true, phone: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;