<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';

  export let user: any = null;
</script>

<div class="min-h-screen bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-950">
  <div class="container mx-auto px-6 py-16">
    <!-- Hero Section -->
    <section class="text-center mb-12">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome back, {user?.name || 'User'}!
      </h1>
      <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Manage your account, security settings, and profile information.
      </p>
    </section>

    <!-- User Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Role</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white capitalize">{user?.role || 'User'}</p>
          </div>
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Email Status</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.emailVerified ? 'Verified' : 'Pending'}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Security Settings</h2>
        <div class="space-y-4">
          <Button variant="primary" fullWidth={true}>
            Change Password
          </Button>
          <Button variant="secondary" fullWidth={true}>
            Two-Factor Authentication
          </Button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Profile Settings</h2>
        <div class="space-y-4">
          <Button variant="primary" fullWidth={true}>
            Edit Profile
          </Button>
          <Button variant="secondary" fullWidth={true}>
            Notification Preferences
          </Button>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Activity</h2>
      <div class="space-y-3">
        <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Successfully logged in</span>
          <span class="text-xs text-gray-400 ml-auto">2 minutes ago</span>
        </div>
        <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Profile updated</span>
          <span class="text-xs text-gray-400 ml-auto">1 hour ago</span>
        </div>
        <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span class="text-sm text-gray-600 dark:text-gray-300">Password changed</span>
          <span class="text-xs text-gray-400 ml-auto">3 days ago</span>
        </div>
      </div>
    </div>
  </div>
</div>
