<script>
	import '../../../app.css';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';

	import imgGoogle from '$lib/assets/images/google.svg';
	import imgLogo from '$lib/assets/images/logo.png';
	import {
		Users,
		BarChart3,
		CheckSquare,
		TrendingUp,
		Zap,
		Check,
		Shield,
		Github,
		Star,
		Mail,
		Lock,
		Eye,
		EyeOff,
		AlertCircle
	} from '@lucide/svelte';

	export let data;

	/** @type {import('./$types').ActionData} */
	export let form;

	let mounted = false;
	let isLoading = false;
	let isGoogleLoading = false;
	let showPassword = false;

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

	function handleGoogleLogin() {
		isGoogleLoading = true;
		// The actual navigation will happen via the href
		setTimeout(() => {
			isGoogleLoading = false;
		}, 3000);
	}

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
    <title>Login | BottleCRM - Free Open-Source CRM for Startups</title>
    <meta name="description" content="Sign in to BottleCRM - the completely free, open-source CRM solution for startups and small businesses. No subscription fees, unlimited users." />
</svelte:head>

<!-- Main Container with Gradient Background -->
<div class="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 bg-black/10"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    
    <!-- Floating Background Shapes -->
    <div class="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    
    <div class="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-6xl mx-auto">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                
                <!-- Left Side - Branding & Features -->
                <div class="hidden lg:block text-white">
                    {#if mounted}
                        <div in:fly="{{ x: -50, duration: 800, delay: 200 }}">
                            <div class="mb-8">
                                <div class="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                                    <Star class="w-4 h-4 mr-2" />
                                    <span class="text-sm font-medium">Free & Open Source CRM</span>
                                </div>
                                
                                <h1 class="text-4xl xl:text-5xl font-extrabold mb-6 leading-tight">
                                    Welcome to <span class="text-yellow-300">BottleCRM</span>
                                </h1>
                                
                                <p class="text-xl text-blue-100 mb-8 leading-relaxed">
                                    The completely free, self-hostable CRM solution built specifically for startups and growing businesses.
                                </p>
                            </div>

                            <!-- Key Benefits -->
                            <div class="mb-8">
                                <h3 class="text-lg font-semibold mb-4">Why Choose BottleCRM?</h3>
                                <ul class="space-y-3">
                                    {#each benefits as benefit, i}
                                        <li class="flex items-center" in:fly="{{ x: -30, duration: 600, delay: 400 + (i * 100) }}">
                                            <Check class="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>

                            <!-- Feature Icons -->
                            <div class="grid grid-cols-2 gap-4">
                                {#each features as feature, i}
                                    <div class="flex items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                                         in:fly="{{ y: 30, duration: 600, delay: 600 + (i * 100) }}">
                                        <div class="rounded-lg bg-white/20 p-2 mr-3">
                                            {#snippet featureIcon(/** @type {any} */ icon)}
                                                {@const FeatureIcon = icon}
                                                <FeatureIcon class="w-5 h-5" />
                                            {/snippet}
                                            {@render featureIcon(feature.icon)}
                                        </div>
                                        <span class="text-sm font-medium">{feature.text}</span>
                                    </div>
                                {/each}
                            </div>

                            <!-- Stats -->
                            <div class="mt-8 pt-8 border-t border-white/20">
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

                <!-- Right Side - Login Form -->
                <div class="flex justify-center lg:justify-end">
                    {#if mounted}
                        <div class="w-full max-w-md" in:fly="{{ y: 50, duration: 800, delay: 100 }}">
                            <!-- Login Card -->
                            <div class="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
                                
                                <!-- Card Background Pattern -->
                                <div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>
                                
                                <!-- Card Content -->
                                <div class="relative z-10">
                                    <!-- Logo and Header -->
                                    <div class="text-center mb-8">
                                        <div class="mb-6" in:fade="{{ duration: 600, delay: 300 }}">
                                            <img src="{imgLogo}" alt="BottleCRM Logo" class="mx-auto h-16 w-auto" />
                                        </div>
                                        
                                        <div in:fade="{{ duration: 600, delay: 400 }}">
                                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                                            <p class="text-gray-600 text-sm leading-relaxed">
                                                Sign in to your free BottleCRM account and start managing your customer relationships more effectively.
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Benefits List for Mobile -->
                                    <div class="mb-6 lg:hidden" in:fade={{ duration: 600, delay: 500 }}>
                                        <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                            <div class="mb-3 flex items-center">
                                                <Zap class="mr-2 h-5 w-5 text-blue-600" />
                                                <span class="text-sm font-semibold text-blue-900">Free CRM Features</span>
                                            </div>
                                            <ul class="space-y-2 text-xs text-blue-700">
                                                <li class="flex items-center">
                                                    <Check class="mr-2 h-3 w-3 flex-shrink-0" />
                                                    <span>Unlimited contacts & users</span>
                                                </li>
                                                <li class="flex items-center">
                                                    <Check class="mr-2 h-3 w-3 flex-shrink-0" />
                                                    <span>Self-hosted solution</span>
                                                </li>
                                                <li class="flex items-center">
                                                    <Check class="mr-2 h-3 w-3 flex-shrink-0" />
                                                    <span>No subscription fees</span>
                                                </li>
                                            </ul>
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

                                    <!-- Email/Password Login Form -->
                                    <form method="POST" use:enhance={handleSubmit} class="space-y-4">
                                        <!-- Email Field -->
                                        <div in:fade={{ duration: 600, delay: 550 }}>
                                            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <div class="relative">
                                                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
                                                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
                                        </div>

                                        <!-- Submit Button -->
                                        <div in:fade={{ duration: 600, delay: 650 }}>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                class="group relative w-full transform overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <div class="absolute inset-0 translate-x-[-100%] transform bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover:translate-x-[100%]"></div>
                                                <span class="relative z-10 flex items-center justify-center gap-2">
                                                    {#if isLoading}
                                                        <div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                        <span>Signing in...</span>
                                                    {:else}
                                                        <span>Sign In</span>
                                                    {/if}
                                                </span>
                                            </button>
                                        </div>
                                    </form>

                                    <!-- Divider -->
                                    <div class="my-6 flex items-center" in:fade={{ duration: 600, delay: 700 }}>
                                        <div class="flex-1 border-t border-gray-200"></div>
                                        <span class="px-4 text-sm text-gray-500">or</span>
                                        <div class="flex-1 border-t border-gray-200"></div>
                                    </div>

                                    <!-- Google Sign In Button -->
                                    <div in:fade={{ duration: 600, delay: 750 }}>
                                        <a
                                            href={data['google_url']}
                                            onclick={handleGoogleLogin}
                                            class="group relative flex w-full transform items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-gray-200 bg-white px-6 py-4 font-semibold text-gray-800 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
                                        >
                                            <!-- Button Background Effect -->
                                            <div class="absolute inset-0 translate-x-[-100%] transform bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 transition-transform duration-1000 group-hover:translate-x-[100%]"></div>

                                            <!-- Loading Spinner -->
                                            {#if isGoogleLoading}
                                                <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                            {:else}
                                                <img src={imgGoogle} alt="Google" class="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                                            {/if}

                                            <span class="relative z-10">
                                                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                                            </span>
                                        </a>
                                    </div>

                                    <!-- Register Link -->
                                    <div class="mt-4 text-center" in:fade={{ duration: 600, delay: 800 }}>
                                        <p class="text-sm text-gray-600">
                                            Don't have an account?
                                            <a href="/register" class="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800">
                                                Create one
                                            </a>
                                        </p>
                                    </div>

                                    <!-- Security Notice -->
                                    <div class="mt-4 text-center" in:fade={{ duration: 600, delay: 850 }}>
                                        <div class="mb-3 flex items-center justify-center text-xs text-gray-500">
                                            <Shield class="mr-1 h-4 w-4" />
                                            <span>Your data is secure and private</span>
                                        </div>

                                        <!-- Footer Links -->
                                        <div class="flex items-center justify-center space-x-4 text-xs">
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
                                            <a href="/features" class="text-gray-600 transition-colors duration-200 hover:text-blue-600">
                                                Features
                                            </a>
                                            <span class="text-gray-300">•</span>
                                            <a href="/contact" class="text-gray-600 transition-colors duration-200 hover:text-blue-600">
                                                Support
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Below Card Notice -->
                            <div class="mt-6 text-center" in:fade={{ duration: 600, delay: 900 }}>
                                <p class="text-sm text-blue-100">
                                    New to BottleCRM?
                                    <a href="/" class="font-medium text-yellow-300 underline transition-colors duration-200 hover:text-yellow-200">
                                        Learn more about our free CRM
                                    </a>
                                </p>
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
        0%, 100% {
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

