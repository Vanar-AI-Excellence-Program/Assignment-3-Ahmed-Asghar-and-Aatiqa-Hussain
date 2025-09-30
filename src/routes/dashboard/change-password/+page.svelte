<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Redirect if not authenticated
  $: if (!$page.data.user) {
    goto('/login');
  }
</script>

<svelte:head>
  <title>Change Password - ShieldAuth</title>
  <meta name="description" content="Change your account password" />
</svelte:head>

<!-- Single Panel Responsive Layout -->
<div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Main Card -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
      <!-- Header with Icon -->
      <div class="text-center mb-8">
        <!-- Key Icon -->
        <div class="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"></path>
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-3">
          Change Password
        </h1>
        
        <p class="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Click the button below to receive a password reset link at your registered email address.
        </p>
      </div>

      <!-- Error Messages -->
      {#if $page.form?.error}
        <div class="mb-6 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-sky-700 dark:text-sky-200">{$page.form.error}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Success Messages -->
      {#if $page.form?.success}
        <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700 dark:text-green-200">{$page.form.success}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Email Display -->
      {#if $page.data.user?.email}
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <div>
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Password reset will be sent to:</p>
              <p class="text-sm text-blue-700 dark:text-blue-300 break-all">{$page.data.user.email}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="space-y-4">
        <form method="POST">
          <button
            type="submit"
            class="group relative w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Password Reset Link
          </button>
        </form>
        
        <button
          type="button"
          on:click={() => goto('/')}
          class="w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-semibold rounded-xl text-gray-300 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <!-- Security Notice -->
      <div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div class="flex">
          <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Security Notice:</strong> You will receive an email with a secure link to change your password. The link will expire in 1 hour.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-6">
      <a href="/" class="text-2xl font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        ShieldAuth
      </a>
    </div>
  </div>
</div>