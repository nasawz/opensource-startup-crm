<script>
	import '../../../app.css';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';

	import imgLogo from '$lib/assets/images/logo.png';
	import {
		Users,
		BarChart3,
		CheckSquare,
		TrendingUp,
		Check,
		Shield,
		Github,
		Star,
		Mail,
		Lock,
		User,
		Eye,
		EyeOff,
		AlertCircle
	} from '@lucide/svelte';

	/** @type {import('./$types').ActionData} */
	export let form;

	let mounted = false;
	let isLoading = false;
	let showPassword = false;
	let showConfirmPassword = false;

	const features = [
		{ icon: Users, text: 'Unlimited Contacts' },
		{ icon: BarChart3, text: 'Sales Pipeline' },
		{ icon: CheckSquare, text: 'Task Management' },
		{ icon: TrendingUp, text: 'Analytics & Reports' }
	];

	const benefits = [
		'100% Free Forever',
		'No Credit Card Required',
		'Complete Data Ownership',
		'Self-Hostable Solution'
	];

	onMount(() => {
		mounted = true;
	});

	/**
	 * @param {{ formData: FormData; cancel: () => void }} params
	 */
	function handleSubmit({ formData, cancel }) {
		isLoading = true;
		return async ({ update }) => {
			await update();
			isLoading = false;
		};
	}
</script>

<svelte:head>
	<title>Register | BottleCRM - Free Open-Source CRM for Startups</title>
	<meta
		name="description"
		content="Create your free BottleCRM account - the completely free, open-source CRM solution for startups and small businesses."
	/>
</svelte:head>

<!-- Main Container with Gradient Background -->
<div
	class="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"
>
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 bg-black/10"></div>
	<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

	<!-- Floating Background Shapes -->
	<div
		class="absolute left-10 top-10 h-72 w-72 animate-pulse rounded-full bg-white/5 blur-3xl"
	></div>
	<div
		class="absolute bottom-10 right-10 h-96 w-96 animate-pulse rounded-full bg-blue-400/10 blur-3xl"
		style="animation-delay: 1s;"
	></div>

	<div class="relative z-10 flex min-h-screen items-center justify-center p-4">
		<div class="mx-auto w-full max-w-6xl">
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<!-- Left Side - Branding & Features -->
				<div class="hidden text-white lg:block">
					{#if mounted}
						<div in:fly={{ x: -50, duration: 800, delay: 200 }}>
							<div class="mb-8">
								<div
									class="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
								>
									<Star class="mr-2 h-4 w-4" />
									<span class="text-sm font-medium">Free & Open Source CRM</span>
								</div>

								<h1 class="mb-6 text-4xl font-extrabold leading-tight xl:text-5xl">
									Join <span class="text-yellow-300">BottleCRM</span>
								</h1>

								<p class="mb-8 text-xl leading-relaxed text-blue-100">
									Create your free account and start managing customer relationships with the most
									powerful open-source CRM.
								</p>
							</div>

							<!-- Key Benefits -->
							<div class="mb-8">
								<h3 class="mb-4 text-lg font-semibold">Why Choose BottleCRM?</h3>
								<ul class="space-y-3">
									{#each benefits as benefit, i}
										<li
											class="flex items-center"
											in:fly={{ x: -30, duration: 600, delay: 400 + i * 100 }}
										>
											<Check class="mr-3 h-5 w-5 flex-shrink-0 text-green-400" />
											<span>{benefit}</span>
										</li>
									{/each}
								</ul>
							</div>

							<!-- Feature Icons -->
							<div class="grid grid-cols-2 gap-4">
								{#each features as feature, i}
									<div
										class="flex items-center rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm"
										in:fly={{ y: 30, duration: 600, delay: 600 + i * 100 }}
									>
										<div class="mr-3 rounded-lg bg-white/20 p-2">
											{#snippet featureIcon(/** @type {any} */ icon)}
												{@const FeatureIcon = icon}
												<FeatureIcon class="h-5 w-5" />
											{/snippet}
											{@render featureIcon(feature.icon)}
										</div>
										<span class="text-sm font-medium">{feature.text}</span>
									</div>
								{/each}
							</div>

							<!-- Stats -->
							<div class="mt-8 border-t border-white/20 pt-8">
								<div class="grid grid-cols-3 gap-4 text-center">
									<div>
										<div class="text-2xl font-bold text-yellow-300">100%</div>
										<div class="text-sm text-blue-200">Free</div>
									</div>
									<div>
										<div class="text-2xl font-bold text-yellow-300">∞</div>
										<div class="text-sm text-blue-200">Users</div>
									</div>
									<div>
										<div class="text-2xl font-bold text-yellow-300">MIT</div>
										<div class="text-sm text-blue-200">License</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Right Side - Register Form -->
				<div class="flex justify-center lg:justify-end">
					{#if mounted}
						<div class="w-full max-w-md" in:fly={{ y: 50, duration: 800, delay: 100 }}>
							<!-- Register Card -->
							<div
								class="relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-lg"
							>
								<!-- Card Background Pattern -->
								<div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>

								<!-- Card Content -->
								<div class="relative z-10">
									<!-- Logo and Header -->
									<div class="mb-6 text-center">
										<div class="mb-4" in:fade={{ duration: 600, delay: 300 }}>
											<img src={imgLogo} alt="BottleCRM Logo" class="mx-auto h-12 w-auto" />
										</div>

										<div in:fade={{ duration: 600, delay: 400 }}>
											<h2 class="mb-2 text-2xl font-bold text-gray-900">Create Account</h2>
											<p class="text-sm leading-relaxed text-gray-600">
												Fill in your details to get started with BottleCRM
											</p>
										</div>
									</div>

									<!-- Error Message -->
									{#if form?.error}
										<div
											class="mb-4 flex items-center rounded-lg border border-red-200 bg-red-50 p-3"
											in:fade={{ duration: 300 }}
										>
											<AlertCircle class="mr-2 h-5 w-5 flex-shrink-0 text-red-500" />
											<span class="text-sm text-red-700">{form.error}</span>
										</div>
									{/if}

									<!-- Register Form -->
									<form method="POST" use:enhance={handleSubmit} class="space-y-4">
										<!-- Name Field -->
										<div in:fade={{ duration: 600, delay: 500 }}>
											<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
												Name
											</label>
											<div class="relative">
												<div
													class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
												>
													<User class="h-5 w-5 text-gray-400" />
												</div>
												<input
													type="text"
													id="name"
													name="name"
													value={form?.name || ''}
													required
													class="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
													placeholder="Your name"
												/>
											</div>
										</div>

										<!-- Email Field -->
										<div in:fade={{ duration: 600, delay: 550 }}>
											<label for="email" class="mb-1 block text-sm font-medium text-gray-700">
												Email
											</label>
											<div class="relative">
												<div
													class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
												>
													<Mail class="h-5 w-5 text-gray-400" />
												</div>
												<input
													type="email"
													id="email"
													name="email"
													value={form?.email || ''}
													required
													class="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
													placeholder="you@example.com"
												/>
											</div>
										</div>

										<!-- Password Field -->
										<div in:fade={{ duration: 600, delay: 600 }}>
											<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
												Password
											</label>
											<div class="relative">
												<div
													class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
												>
													<Lock class="h-5 w-5 text-gray-400" />
												</div>
												<input
													type={showPassword ? 'text' : 'password'}
													id="password"
													name="password"
													required
													class="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-12 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
													placeholder="••••••••"
												/>
												<button
													type="button"
													onclick={() => (showPassword = !showPassword)}
													class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
												>
													{#if showPassword}
														<EyeOff class="h-5 w-5" />
													{:else}
														<Eye class="h-5 w-5" />
													{/if}
												</button>
											</div>
											<p class="mt-1 text-xs text-gray-500">
												At least 8 characters with uppercase, lowercase, and number
											</p>
										</div>

										<!-- Confirm Password Field -->
										<div in:fade={{ duration: 600, delay: 650 }}>
											<label
												for="confirmPassword"
												class="mb-1 block text-sm font-medium text-gray-700"
											>
												Confirm Password
											</label>
											<div class="relative">
												<div
													class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
												>
													<Lock class="h-5 w-5 text-gray-400" />
												</div>
												<input
													type={showConfirmPassword ? 'text' : 'password'}
													id="confirmPassword"
													name="confirmPassword"
													required
													class="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-12 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
													placeholder="••••••••"
												/>
												<button
													type="button"
													onclick={() => (showConfirmPassword = !showConfirmPassword)}
													class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
												>
													{#if showConfirmPassword}
														<EyeOff class="h-5 w-5" />
													{:else}
														<Eye class="h-5 w-5" />
													{/if}
												</button>
											</div>
										</div>

										<!-- Submit Button -->
										<div in:fade={{ duration: 600, delay: 700 }}>
											<button
												type="submit"
												disabled={isLoading}
												class="group relative w-full transform overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
											>
												<!-- Button Background Effect -->
												<div
													class="absolute inset-0 translate-x-[-100%] transform bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover:translate-x-[100%]"
												></div>

												<span class="relative z-10 flex items-center justify-center gap-2">
													{#if isLoading}
														<div
															class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
														></div>
														<span>Creating account...</span>
													{:else}
														<span>Create Account</span>
													{/if}
												</span>
											</button>
										</div>
									</form>

									<!-- Divider -->
									<div class="my-6 flex items-center" in:fade={{ duration: 600, delay: 750 }}>
										<div class="flex-1 border-t border-gray-200"></div>
										<span class="px-4 text-sm text-gray-500">or</span>
										<div class="flex-1 border-t border-gray-200"></div>
									</div>

									<!-- Login Link -->
									<div class="text-center" in:fade={{ duration: 600, delay: 800 }}>
										<p class="text-sm text-gray-600">
											Already have an account?
											<a
												href="/login"
												class="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800"
											>
												Sign in
											</a>
										</p>
									</div>

									<!-- Security Notice -->
									<div class="mt-4 text-center" in:fade={{ duration: 600, delay: 850 }}>
										<div class="flex items-center justify-center text-xs text-gray-500">
											<Shield class="mr-1 h-4 w-4" />
											<span>Your data is secure and private</span>
										</div>

										<!-- Footer Links -->
										<div class="mt-3 flex items-center justify-center space-x-4 text-xs">
											<a
												href="https://github.com/MicroPyramid/opensource-startup-crm"
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center text-gray-600 transition-colors duration-200 hover:text-blue-600"
											>
												<Github class="mr-1 h-3 w-3" />
												<span>Open Source</span>
											</a>
											<span class="text-gray-300">•</span>
											<a
												href="/features"
												class="text-gray-600 transition-colors duration-200 hover:text-blue-600"
											>
												Features
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.05);
			opacity: 0.8;
		}
	}

	.animate-pulse {
		animation: pulse 4s ease-in-out infinite;
	}
</style>
