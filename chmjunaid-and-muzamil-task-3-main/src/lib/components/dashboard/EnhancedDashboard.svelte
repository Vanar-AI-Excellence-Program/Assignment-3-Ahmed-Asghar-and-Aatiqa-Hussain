<script lang="ts">
  import Card from '../ui/Card.svelte';
  import Button from '../ui/Button.svelte';
  
  export let user: any = null;
  export let stats: any = null;
  
  // Mock stats if not provided
  $: dashboardStats = stats || {
    totalUsers: 1234,
    activeSessions: 89,
    pendingVerifications: 23,
    lastLogin: new Date().toLocaleDateString(),
    role: user?.role || 'user',
    emailVerified: user?.emailVerified || false,
    twoFactorEnabled: user?.twoFactorEnabled || false
  };
  
  const recentActivity = [
    { action: 'Login', timestamp: '2 hours ago', status: 'success' },
    { action: 'Password Changed', timestamp: '1 day ago', status: 'success' },
    { action: 'Email Verified', timestamp: '3 days ago', status: 'success' },
    { action: 'Profile Updated', timestamp: '1 week ago', status: 'success' }
  ];
  
  const quickActions = [
    { label: 'Change Password', icon: '🔑', href: '/settings/password' },
    { label: 'Update Profile', icon: '👤', href: '/profile' },
    { label: 'Manage Sessions', icon: '📱', href: '/settings/sessions' },
    { label: 'Enable 2FA', icon: '🔒', href: '/settings/security' }
  ];
</script>

<!-- Main container with merged classes -->
<div {...$$restProps} class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Welcome Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      Welcome back, {user?.name || user?.email}!
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Here's what's happening with your account today.
    </p>
  </div>
  
  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Card variant="elevated">
      <div class="p-6 text-center">
        <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
          {dashboardStats.totalUsers}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
      </div>
    </Card>
    
    <Card variant="elevated">
      <div class="p-6 text-center">
        <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
          {dashboardStats.activeSessions}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
      </div>
    </Card>
    
    <Card variant="elevated">
      <div class="p-6 text-center">
        <div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
          {dashboardStats.pendingVerifications}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</div>
      </div>
    </Card>
    
    <Card variant="elevated">
      <div class="p-6 text-center">
        <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {dashboardStats.role}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Your Role</div>
      </div>
    </Card>
  </div>
  
  <!-- Main Dashboard Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Column - User Info & Quick Actions -->
    <div class="space-y-6">
      <!-- User Info Card -->
      <Card variant="elevated">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Overview</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Email:</span>
              <span class="font-medium">{user?.email}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Role:</span>
              <span class="font-medium">{user?.role}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Email Verified:</span>
              <span class="font-medium {dashboardStats.emailVerified ? 'text-green-600' : 'text-red-600'}">
                {dashboardStats.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">2FA Enabled:</span>
              <span class="font-medium {dashboardStats.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}">
                {dashboardStats.twoFactorEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Last Login:</span>
              <span class="font-medium">{dashboardStats.lastLogin}</span>
            </div>
          </div>
        </divThe TypeScript error "Expected token }" at line 111 indicates a missing or extra closing brace in the script or markup. I will carefully check the component code around that line and fix any unbalanced braces or syntax issues.

I will now fix the missing or extra brace issue in the EnhancedDashboard.svelte file.

<edit_file>
<path>my-app/src/lib/components/dashboard/EnhancedDashboard.svelte</path>
<content>
<<<<<<< SEARCH
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Role:</span>
              <span class="fontThe error "Expected token }" usually means a missing or extra closing brace. The last visible line is incomplete: `<span class="fontThe error "Expected token }" usually means a missing or extra closing brace. The last visible line is incomplete: `<span class="font`
=======
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Role:</span>
              <span class="font-medium">{user?.role}</span>
