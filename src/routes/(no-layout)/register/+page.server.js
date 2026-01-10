import prisma from '$lib/prisma';
import { redirect, fail } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
	name: z.string().min(2, '姓名至少需要2个字符').max(100, '姓名不能超过100个字符'),
	email: z.string().email('请输入有效的邮箱地址'),
	password: z
		.string()
		.min(8, '密码至少需要8个字符')
		.regex(/[A-Z]/, '密码需要包含至少一个大写字母')
		.regex(/[a-z]/, '密码需要包含至少一个小写字母')
		.regex(/[0-9]/, '密码需要包含至少一个数字'),
	confirmPassword: z.string()
});

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ cookies }) {
	// Check if the user is already authenticated
	const sessionId = cookies.get('session');
	if (sessionId) {
		const user = await prisma.user.findUnique({
			where: { session_id: sessionId }
		});

		if (user) {
			throw redirect(307, '/bounce');
		}
	}

	return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString() || '';
		const email = formData.get('email')?.toString().toLowerCase() || '';
		const password = formData.get('password')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		// Validate input
		const result = registerSchema.safeParse({ name, email, password, confirmPassword });

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return fail(400, {
				error: Object.values(errors).flat()[0] || '输入验证失败',
				name,
				email
			});
		}

		// Check if passwords match
		if (password !== confirmPassword) {
			return fail(400, {
				error: '两次输入的密码不一致',
				name,
				email
			});
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email }
		});

		if (existingUser) {
			// If user exists but has no password (Google OAuth user), don't allow registration
			if (existingUser.password === null) {
				return fail(400, {
					error: '该邮箱已通过 Google 账号注册，请使用 Google 登录',
					name,
					email
				});
			}
			return fail(400, {
				error: '该邮箱已被注册',
				name,
				email
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const session_id = uuidv4();
		const user_id = uuidv4();

		try {
			await prisma.user.create({
				data: {
					email,
					name,
					password: hashedPassword,
					user_id,
					session_id,
					lastLogin: new Date()
				}
			});

			// Set session cookie
			await cookies.set('session', session_id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: true,
				maxAge: 60 * 60 * 24 * 7 // one week
			});

			throw redirect(307, '/bounce');
		} catch (err) {
			// Check if it's a redirect (which is thrown as an error in SvelteKit)
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}

			console.error('Registration error:', err);
			return fail(500, {
				error: '注册失败，请稍后重试',
				name,
				email
			});
		}
	}
};
