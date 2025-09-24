<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  
  export let users: any[] = [];
  
  let stats = {
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    verifiedUsers: 0
  };
  
  let loading = true;
  let userGrowthData: any[] = [];
  let userActivityData: any[] = [];
  let userGrowthChart: any;
  let userActivityChart: any;
  
  // Calculate basic user stats
  $: {
    stats.totalUsers = users.length;
    stats.adminUsers = users.filter(u => u.role === 'admin').length;
    stats.regularUsers = users.filter(u => u.role === 'user').length;
    stats.verifiedUsers = users.filter(u => u.emailVerified).length;
  }
  
  onMount(async () => {
    try {
      // Simulate user growth data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      userGrowthData = months.map((month, index) => ({
        month,
        users: Math.floor(Math.random() * 50) + 10 + (index * 5)
      }));
      
      // Simulate user activity data (last 7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      userActivityData = days.map(day => ({
        day,
        activeUsers: Math.floor(Math.random() * 100) + 50
      }));
      
      // Wait for the next tick to ensure DOM is ready
      setTimeout(() => {
        createCharts();
      }, 100);
      
    } catch (error) {
      console.error('Error generating data:', error);
    } finally {
      loading = false;
    }
  });
  
  function createCharts() {
    // User Growth Chart (Line Chart)
    const growthCtx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (growthCtx) {
      userGrowthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
          labels: userGrowthData.map(d => d.month),
          datasets: [{
            label: 'New Users',
            data: userGrowthData.map(d => d.users),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(75, 85, 99, 0.2)'
              },
              ticks: {
                color: '#9ca3af'
              }
            },
            x: {
              grid: {
                color: 'rgba(75, 85, 99, 0.2)'
              },
              ticks: {
                color: '#9ca3af'
              }
            }
          }
        }
      });
    }
    
    // User Activity Chart (Bar Chart)
    const activityCtx = document.getElementById('userActivityChart') as HTMLCanvasElement;
    if (activityCtx) {
      userActivityChart = new Chart(activityCtx, {
        type: 'bar',
        data: {
          labels: userActivityData.map(d => d.day),
          datasets: [{
            label: 'Active Users',
            data: userActivityData.map(d => d.activeUsers),
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: '#9333ea',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(75, 85, 99, 0.2)'
              },
              ticks: {
                color: '#9ca3af'
              }
            },
            x: {
              grid: {
                color: 'rgba(75, 85, 99, 0.2)'
              },
              ticks: {
                color: '#9ca3af'
              }
            }
          }
        }
      });
    }
  }
  
  const statCards = [
    {
      title: 'Total Users',
      value: () => stats.totalUsers,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      color: 'blue',
      description: 'Registered users'
    },
    {
      title: 'Admin Users',
      value: () => stats.adminUsers,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'red',
      description: 'System administrators'
    },
    {
      title: 'Regular Users',
      value: () => stats.regularUsers,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'green',
      description: 'Standard users'
    },
    {
      title: 'Verified Users',
      value: () => stats.verifiedUsers,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'purple',
      description: 'Email verified'
    }
  ];
  
  function getColorClasses(color: string) {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400',
      red: 'bg-red-500/20 text-red-400',
      green: 'bg-green-500/20 text-green-400',
      purple: 'bg-purple-500/20 text-purple-400'
    };
    return colors[color] || colors.blue;
  }
</script>

<div class="space-y-8 p-6">
  <!-- Page Title -->
  <div class="text-center mb-8">
    <h2 class="text-3xl font-bold text-white mb-3">User Overview</h2>
    <p class="text-gray-400 text-lg">Comprehensive insights into user statistics and growth patterns</p>
  </div>

  <!-- Statistics Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {#each statCards as card}
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-750 transition-colors shadow-lg">
        <div class="flex items-center">
          <div class="p-3 rounded-lg {getColorClasses(card.color)} mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={card.icon}></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-400 mb-2">{card.title}</p>
            <p class="text-2xl font-semibold text-white mb-2">
              {#if loading}
                <span class="animate-pulse">--</span>
              {:else}
                {card.value().toLocaleString()}
              {/if}
            </p>
            <p class="text-xs text-gray-500">{card.description}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Charts Grid - Side by Side -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- User Growth Over Time Chart -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-white mb-6 text-center">User Growth Over Time</h3>
      <div class="h-64 flex items-center justify-center">
        <canvas id="userGrowthChart" width="400" height="256"></canvas>
      </div>
    </div>

    <!-- User Activity Trends Chart -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-white mb-6 text-center">User Activity Trends</h3>
      <div class="h-64 flex items-center justify-center">
        <canvas id="userActivityChart" width="400" height="256"></canvas>
      </div>
    </div>
  </div>
</div>

<style>
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }
</style>
