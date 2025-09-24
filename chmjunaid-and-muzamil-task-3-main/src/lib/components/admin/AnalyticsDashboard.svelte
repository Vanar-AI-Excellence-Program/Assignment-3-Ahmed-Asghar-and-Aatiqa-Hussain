<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  
  Chart.register(...registerables);
  
  let conversationsTrendCanvas;
  let userLoginsCanvas;
  let activityDistributionCanvas;
  let userGrowthCanvas;
  
  let conversationsTrendChart;
  let userLoginsChart;
  let activityDistributionChart;
  let userGrowthChart;
  
  let analyticsData = {
    todayStats: {
      conversations: 0,
      logins: 0,
      totalUsers: 0,
      newRegistrations: 0
    },
    conversationsTrend: [],
    userLogins: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    userGrowth: [],
    activityDistribution: []
  };
  
  let loading = true;
  let error = '';
  
  onMount(async () => {
    await loadAnalyticsData();
    initializeCharts();
  });
  
  // Cleanup function for component destroy
  onDestroy(() => {
    if (conversationsTrendChart) conversationsTrendChart.destroy();
    if (userLoginsChart) userLoginsChart.destroy();
    if (activityDistributionChart) activityDistributionChart.destroy();
    if (userGrowthChart) userGrowthChart.destroy();
  });
  
  async function loadAnalyticsData() {
    try {
      const response = await fetch('/admin/api/analytics');
      if (response.ok) {
        analyticsData = await response.json();
      } else {
        error = 'Failed to load analytics data';
      }
    } catch (err) {
      error = 'Error loading analytics data';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }
  
  function initializeCharts() {
    // Conversations Trend Chart
    if (conversationsTrendCanvas) {
      conversationsTrendChart = new Chart(conversationsTrendCanvas, {
        type: 'line',
        data: {
          labels: analyticsData.conversationsTrend.map(d => d.date),
          datasets: [{
            label: 'Conversations',
            data: analyticsData.conversationsTrend.map(d => d.count),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
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
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            },
            x: {
              grid: {
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            }
          }
        }
      });
    }
    
    // User Logins Chart
    if (userLoginsCanvas) {
      userLoginsChart = new Chart(userLoginsCanvas, {
        type: 'bar',
        data: {
          labels: ['Today', 'This Week', 'This Month'],
          datasets: [{
            label: 'User Logins',
            data: [
              analyticsData.userLogins.today,
              analyticsData.userLogins.thisWeek,
              analyticsData.userLogins.thisMonth
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(168, 85, 247)'
            ],
            borderWidth: 1
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
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            }
          }
        }
      });
    }
    
    // Activity Distribution Chart
    if (activityDistributionCanvas) {
      activityDistributionChart = new Chart(activityDistributionCanvas, {
        type: 'doughnut',
        data: {
          labels: analyticsData.activityDistribution.map(d => d.type),
          datasets: [{
            data: analyticsData.activityDistribution.map(d => d.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)',
              'rgb(168, 85, 247)',
              'rgb(245, 158, 11)',
              'rgb(236, 72, 153)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'rgb(156, 163, 175)',
                usePointStyle: true,
                padding: 20
              }
            }
          }
        }
      });
    }
    
    // User Growth Chart
    if (userGrowthCanvas) {
      userGrowthChart = new Chart(userGrowthCanvas, {
        type: 'line',
        data: {
          labels: analyticsData.userGrowth.map(d => d.date),
          datasets: [{
            label: 'Total Users',
            data: analyticsData.userGrowth.map(d => d.totalUsers),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
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
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            },
            x: {
              grid: {
                color: 'rgba(75, 85, 99, 0.3)'
              },
              ticks: {
                color: 'rgb(156, 163, 175)'
              }
            }
          }
        }
      });
    }
  }
</script>

<div class="space-y-6">
  <!-- Summary Counters -->
  <div class="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-gray-600">
    <div class="text-center mb-6">
      <h3 class="text-2xl font-bold text-white mb-2">Today's Activity Summary</h3>
      <p class="text-gray-400">Real-time insights into your platform's performance</p>
    </div>
    
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    {:else if error}
      <div class="text-center py-8">
        <p class="text-red-400">{error}</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-400 mb-2">
            {analyticsData.todayStats.conversations.toLocaleString()}
          </div>
          <div class="text-sm text-gray-400">Conversations</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-400 mb-2">
            {analyticsData.todayStats.logins.toLocaleString()}
          </div>
          <div class="text-sm text-gray-400">Logins</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-400 mb-2">
            {analyticsData.todayStats.totalUsers.toLocaleString()}
          </div>
          <div class="text-sm text-gray-400">Total Users</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-400 mb-2">
            {analyticsData.todayStats.newRegistrations.toLocaleString()}
          </div>
          <div class="text-sm text-gray-400">New Registrations</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Charts Grid -->
  {#if !loading && !error}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Conversations Trend -->
      <div class="card p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Conversations Trend (7 Days)
        </h4>
        <div class="h-64">
          <canvas bind:this={conversationsTrendCanvas}></canvas>
        </div>
      </div>

      <!-- User Logins -->
      <div class="card p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
          User Logins
        </h4>
        <div class="h-64">
          <canvas bind:this={userLoginsCanvas}></canvas>
        </div>
      </div>

      <!-- Activity Distribution -->
      <div class="card p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
          Activity Distribution
        </h4>
        <div class="h-64">
          <canvas bind:this={activityDistributionCanvas}></canvas>
        </div>
      </div>

      <!-- User Growth -->
      <div class="card p-6">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          User Growth (30 Days)
        </h4>
        <div class="h-64">
          <canvas bind:this={userGrowthCanvas}></canvas>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  canvas {
    background: transparent !important;
  }
</style>
