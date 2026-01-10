import axios from 'axios';
import prisma from '$lib/prisma';

import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().email('请输入有效的邮箱地址'),
	password: z.string().min(1, '请输入密码')
});

/**
 * @param {Object} params - OAuth parameters
 * @param {string} params.access_token - Access token
 */
async function fetchUserData(params) {
	const url = 'https://www.googleapis.com/oauth2/v1/userinfo';

	// console.log('access token', params)
	try {
		const response = await axios.get(url, {
			params,
			headers: {},
			timeout: 60000 // timeout in milliseconds
		});
		return response.data;
	} catch (error) {
		console.error('Error:', error);
	}
}

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ url, cookies }) {
	const code = url.searchParams.get('code');
	const redirect_uri = env.GOOGLE_LOGIN_DOMAIN + '/login';

	// Check if the user is already authenticated
	if (code != null) {
		const tokenParams = {
			grant_type: 'authorization_code',
			code,
			redirect_uri,
			client_id: env.GOOGLE_CLIENT_ID,
			client_secret: env.GOOGLE_CLIENT_SECRET
		};
		let info;

		try {
			const response = await axios.post('https://accounts.google.com/o/oauth2/token', tokenParams);
			info = response.data;
		} catch (error) {
			console.error('Error:', error);
		}

		const user_info = await fetchUserData({ access_token: info.access_token });

		const session_id = uuidv4();

		await prisma.user.upsert({
			where: { email: user_info.email },
			update: {
				session_id: session_id,
				profilePhoto: user_info.picture,
				lastLogin: new Date()
			},
			create: {
				email: user_info.email,
				name: user_info.name,
				profilePhoto: user_info.picture,
				user_id: user_info.id,
				session_id: session_id
			}
		});

		await cookies.set('session', session_id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
			maxAge: 60 * 60 * 24 * 7 // one week
		});

		throw redirect(307, '/bounce');
	}

	// Check for existing session
	const sessionId = cookies.get('session');
	if (sessionId) {
		const user = await prisma.user.findUnique({
			where: { session_id: sessionId }
		});

		if (user) {
			throw redirect(307, '/bounce');
		}
	}

	const google_login_url =
		'https://accounts.google.com/o/oauth2/auth?client_id=' +
		env.GOOGLE_CLIENT_ID +
		'&response_type=code' +
		'&scope=https://www.googleapis.com/auth/userinfo.profile ' +
		'https://www.googleapis.com/auth/userinfo.email' +
		'&redirect_uri=' +
		redirect_uri +
		'&state=google';

	return { google_url: google_login_url };
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().toLowerCase() || '';
		const password = formData.get('password')?.toString() || '';

		// Validate input
		const result = loginSchema.safeParse({ email, password });

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return fail(400, {
				error: Object.values(errors).flat()[0] || '输入验证失败',
				email
			});
		}

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email }
		});

		if (!user) {
			return fail(400, {
				error: '邮箱或密码错误',
				email
			});
		}

		// Check if user has a password (not a Google OAuth user without password)
		if (!user.password) {
			return fail(400, {
				error: '该账号使用 Google 登录，请点击下方 Google 按钮登录',
				email
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return fail(400, {
				error: '邮箱或密码错误',
				email
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return fail(400, {
				error: '该账号已被禁用，请联系管理员',
				email
			});
		}

		// Create session
		const session_id = uuidv4();

		try {
			await prisma.user.update({
				where: { id: user.id },
				data: {
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

			console.error('Login error:', err);
			return fail(500, {
				error: '登录失败，请稍后重试',
				email
			});
		}
	}
};
