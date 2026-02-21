import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation schemas
const registerSchema = z.object({
	name: z.string().min(2, '姓名至少需要2个字符').max(100, '姓名不能超过100个字符'),
	email: z.string().email('请输入有效的邮箱地址'),
	password: z
		.string()
		.min(8, '密码至少需要8个字符')
		.regex(/[A-Z]/, '密码需要包含至少一个大写字母')
		.regex(/[a-z]/, '密码需要包含至少一个小写字母')
		.regex(/[0-9]/, '密码需要包含至少一个数字')
});

const loginSchema = z.object({
	email: z.string().email('请输入有效的邮箱地址'),
	password: z.string().min(1, '请输入密码')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleLoginRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           description: Google ID token from mobile app
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             profileImage:
 *               type: string
 *             organizations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: Password (min 8 chars, must include uppercase, lowercase, and number)
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Validate input
		const result = registerSchema.safeParse({ name, email: email?.toLowerCase(), password });

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return res.status(400).json({
				error: Object.values(errors).flat()[0] || '输入验证失败'
			});
		}

		const normalizedEmail = email.toLowerCase();

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: normalizedEmail }
		});

		if (existingUser) {
			if (existingUser.password === null) {
				return res.status(400).json({
					error: '该邮箱已通过 Google 账号注册，请使用 Google 登录'
				});
			}
			return res.status(400).json({
				error: '该邮箱已被注册'
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const user_id = uuidv4();

		const user = await prisma.user.create({
			data: {
				email: normalizedEmail,
				name,
				password: hashedPassword,
				user_id,
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

		// Create JWT token
		const JWTtoken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || '24h'
		});

		// Calculate expiration date
		const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
		const expirationHours = expiresIn.includes('h') ? parseInt(expiresIn) : 24;
		const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

		// Store JWT token in database
		await prisma.jwtToken.create({
			data: {
				token: JWTtoken,
				userId: user.id,
				expiresAt: expiresAt,
				deviceInfo: req.get('User-Agent'),
				ipAddress: req.ip || req.socket.remoteAddress
			}
		});

		// Format response
		const userResponse = {
			id: user.id,
			email: user.email,
			name: user.name,
			profileImage: user.profilePhoto
		};

		res.json({
			success: true,
			JWTtoken,
			user: userResponse,
			organizations: user.organizations.map((uo) => ({
				id: uo.organization.id,
				name: uo.organization.name,
				role: uo.role
			}))
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: '注册失败，请稍后重试' });
	}
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		const result = loginSchema.safeParse({ email: email?.toLowerCase(), password });

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return res.status(400).json({
				error: Object.values(errors).flat()[0] || '输入验证失败'
			});
		}

		const normalizedEmail = email.toLowerCase();

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
			include: {
				organizations: {
					include: {
						organization: true
					}
				}
			}
		});

		if (!user) {
			return res.status(400).json({
				error: '邮箱或密码错误'
			});
		}

		// Check if user has a password (not a Google OAuth only user)
		if (!user.password) {
			return res.status(400).json({
				error: '该账号使用 Google 登录，请使用 Google OAuth'
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return res.status(400).json({
				error: '邮箱或密码错误'
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(400).json({
				error: '该账号已被禁用，请联系管理员'
			});
		}

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() }
		});

		// Create JWT token
		const JWTtoken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || '24h'
		});

		// Calculate expiration date
		const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
		const expirationHours = expiresIn.includes('h') ? parseInt(expiresIn) : 24;
		const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

		// Store JWT token in database
		await prisma.jwtToken.create({
			data: {
				token: JWTtoken,
				userId: user.id,
				expiresAt: expiresAt,
				deviceInfo: req.get('User-Agent'),
				ipAddress: req.ip || req.socket.remoteAddress
			}
		});

		// Format response
		const userResponse = {
			id: user.id,
			email: user.email,
			name: user.name,
			profileImage: user.profilePhoto
		};

		res.json({
			success: true,
			JWTtoken,
			user: userResponse,
			organizations: user.organizations.map((uo) => ({
				id: uo.organization.id,
				name: uo.organization.name,
				role: uo.role
			}))
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: '登录失败，请稍后重试' });
	}
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                     organizations:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, async (req, res) => {
	try {
		const userResponse = {
			id: req.user.id,
			email: req.user.email,
			name: req.user.name,
			profileImage: req.user.profilePhoto,
			organizations: req.user.organizations.map((uo) => ({
				id: uo.organization.id,
				name: uo.organization.name,
				role: uo.role
			}))
		};

		res.json({ user: userResponse });
	} catch (error) {
		console.error('Profile error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth mobile login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid Google token or user not found
 *       500:
 *         description: Server error
 */
router.post('/google', async (req, res) => {
	try {
		const { idToken } = req.body;

		if (!idToken) {
			return res.status(400).json({ error: 'Google ID token is required' });
		}

		// Support both web and mobile client IDs
		const audiences = [process.env.GOOGLE_CLIENT_ID];

		const ticket = await googleClient.verifyIdToken({
			idToken,
			audience: audiences
		});

		const payload = ticket.getPayload();

		if (!payload || !payload.email) {
			return res.status(400).json({ error: 'Invalid Google token' });
		}

		let user = await prisma.user.upsert({
			where: { email: payload.email },
			update: {
				profilePhoto: payload.picture,
				lastLogin: new Date(),
				// Update name fields if they exist in the token
				...(payload.name && { name: payload.name })
			},
			create: {
				email: payload.email,
				name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
				profilePhoto: payload.picture,
				user_id: payload.sub, // Use 'sub' field which is the stable Google user ID
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

		// Create JWT token for API access
		const JWTtoken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || '24h'
		});

		// Calculate expiration date
		const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
		const expirationHours = expiresIn.includes('h') ? parseInt(expiresIn) : 24;
		const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

		// Store JWT token in database
		await prisma.jwtToken.create({
			data: {
				token: JWTtoken,
				userId: user.id,
				expiresAt: expiresAt,
				deviceInfo: req.get('User-Agent'),
				ipAddress: req.ip || req.socket.remoteAddress
			}
		});

		// Format response to match SvelteKit patterns
		const userResponse = {
			id: user.id,
			email: user.email,
			name: user.name,
			profileImage: user.profilePhoto
		};

		res.json({
			success: true,
			JWTtoken,
			user: userResponse,
			organizations: user.organizations.map((uo) => ({
				id: uo.organization.id,
				name: uo.organization.name,
				role: uo.role
			}))
		});
	} catch (error) {
		console.error('Google login error:', error);
		if (error.message && error.message.includes('Invalid token')) {
			return res.status(400).json({ error: 'Invalid Google token' });
		}
		res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke current JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', verifyToken, async (req, res) => {
	try {
		// Revoke the current token
		await prisma.jwtToken.update({
			where: { id: req.tokenId },
			data: {
				isRevoked: true,
				updatedAt: new Date()
			}
		});

		res.json({
			success: true,
			message: 'Successfully logged out'
		});
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

/**
 * @swagger
 * /auth/revoke-all:
 *   post:
 *     summary: Revoke all JWT tokens for current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully revoked all tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 revokedCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.post('/revoke-all', verifyToken, async (req, res) => {
	try {
		// Revoke all tokens for the user
		const result = await prisma.jwtToken.updateMany({
			where: {
				userId: req.userId,
				isRevoked: false
			},
			data: {
				isRevoked: true,
				updatedAt: new Date()
			}
		});

		res.json({
			success: true,
			message: 'Successfully revoked all tokens',
			revokedCount: result.count
		});
	} catch (error) {
		console.error('Revoke all tokens error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
