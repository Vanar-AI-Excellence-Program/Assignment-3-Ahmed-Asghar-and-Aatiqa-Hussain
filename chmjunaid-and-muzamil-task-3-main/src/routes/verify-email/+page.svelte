<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let loading = true;
  let error = '';
  let success = false;
  let userEmail = '';

  $: token = $page.url.searchParams.get('token');

  onMount(async () => {
    if (!token) {
      error = 'Verification token is missing';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (response.ok) {
        success = true;
        userEmail = result.email || '';
      } else {
        error = result.error || 'Verification failed';
      }
    } catch (err) {
      error = 'An error occurred during verification';
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
      {#if loading}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Email...</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Please wait while we verify your email address
          </p>
        </div>
      {:else if success}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Your email address has been successfully verified.
          </p>
          {#if userEmail}
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Verified email: <span class="font-medium">{userEmail}</span>
            </p>
          {/if}
          <Button
            variant="primary"
            fullWidth={true}
            on:click={() => goto('/login')}
          >
            Sign In Now
          </Button>
        </div>
      {:else}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div class="space-y-3">
            <Button
              variant="primary"
              fullWidth={true}
              on:click={() => goto('/login')}
            >
              Go to Login
            </Button>
            <Button
              variant="secondary"
              fullWidth={true}
              on:click={() => goto('/register')}
            >
              Create New Account
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>