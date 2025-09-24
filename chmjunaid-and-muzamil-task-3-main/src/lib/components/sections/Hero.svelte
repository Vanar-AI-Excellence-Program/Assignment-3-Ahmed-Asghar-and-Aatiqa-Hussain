<script lang="ts">
  import Button from '../ui/Button.svelte';
</script>

<section class="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div class="text-center">
      <!-- Hero Badge -->
      <div class="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm font-medium mb-8">
        <span class="mr-2">🚀</span>
        Authenra - Authentication Made Simple
      </div>
      
      <!-- Main Heading -->
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
        Authenra
        <span class="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Authentication Made Simple
        </span>
      </h1>
      
      <!-- Subheading -->
      <p class="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
        Experience seamless authentication with OAuth integration, role-based access control, 
        and enterprise-grade security. Built for developers, designed for users.
      </p>
      
      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button variant="primary" size="lg" on:click={() => window.location.href = '/register'}>
          Get Started Free
        </Button>
        <Button variant="outline" size="lg" on:click={() => window.location.href = '/login'}>
          Sign In
        </Button>
      </div>
      
      <!-- Feature Pills -->
      <div class="mt-12 flex flex-wrap justify-center gap-4">
        {#each ['OAuth Integration', 'Role-Based Access', 'Email Verification', 'Password Reset', 'Admin Dashboard'] as feature}
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
            {feature}
          </span>
        {/each}
      </div>
    </div>
    
    <!-- Hero Illustration -->
    <div class="mt-16 relative">
      <div class="relative mx-auto max-w-4xl">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-3xl opacity-20"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- User Card -->
            <div class="text-center">
              <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">User Dashboard</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Personalized experience with role-based access</p>
            </div>
            
            <!-- Admin Card -->
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Admin Dashboard</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Complete user management and analytics</p>
            </div>
            
            <!-- Security Card -->
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Enterprise Security</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">OAuth, JWT tokens, and encrypted sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
