<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let errorMessage = '';

	onMount(() => {
		const error = $page.url.searchParams.get('error');
		switch (error) {
			case 'OAuthSignin':
				errorMessage = 'Error signing in with OAuth provider. Please try again.';
				break;
			case 'OAuthCallback':
				errorMessage = 'Error in OAuth callback. Please try again.';
				break;
			case 'OAuthCreateAccount':
				errorMessage = 'Could not create OAuth account. Please try again.';
				break;
			case 'EmailCreateAccount':
				errorMessage = 'Could not create account with that email. Please try again.';
				break;
			case 'Callback':
				errorMessage = 'Error in callback. Please try again.';
				break;
			case 'OAuthAccountNotLinked':
				errorMessage = 'Account already exists with this email. Try signing in with your original method first.';
				break;
			default:
				errorMessage = 'An authentication error occurred. Please try again.';
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
	<div class="w-full max-w-md">
		<div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
			<div class="text-center mb-6">
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
					<svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Authentication Error</h2>
			</div>

			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
				{errorMessage}
			</div>

			<div class="space-y-4">
				<a href="/login"
					class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h9.75A2.25 2.25 0 0019.5 18.75V12m-3.75-3L21 3.75M15.75 9L21 3.75M15.75 9H9.75" />
					</svg>
					Try Again
				</a>
				
				<a href="/register"
					class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Create New Account
				</a>
			</div>
		</div>
	</div>
</div>
