import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { users } from '$lib/schema.js';

export async function GET({ url, locals }) {
  try {
    const session = await locals.getSession();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const activityType = url.searchParams.get('type') || 'all';
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const search = url.searchParams.get('search') || '';

    // Get all users for generating mock activities
    const allUsers = await db.select().from(users);

    // Generate mock activities with realistic data
    const generateMockActivities = () => {
      const activities = [];
      const activityTypes = ['login', 'logout', 'chat', 'profile_update', 'password_change', 'admin_action'];
      const descriptions = {
        login: ['User logged in successfully', 'Login attempt from new device', 'Successful authentication'],
        logout: ['User logged out', 'Session expired', 'Manual logout'],
        chat: ['Started new conversation', 'Sent message to AI', 'Created chat session'],
        profile_update: ['Updated profile information', 'Changed display name', 'Updated email preferences'],
        password_change: ['Changed password successfully', 'Password reset completed', 'Security update'],
        admin_action: ['User role updated', 'Account status changed', 'Permissions modified']
      };

      for (let i = 0; i < 100; i++) {
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const description = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
        
        activities.push({
          id: i + 1,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          activityType: type,
          description: description,
          metadata: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
            ...(type === 'profile_update' && { field: 'name', previousValue: 'Old Name', newValue: user.name })
          },
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    let mockActivities = generateMockActivities();

    // Apply filters
    if (activityType !== 'all') {
      mockActivities = mockActivities.filter(activity => activity.activityType === activityType);
    }

    if (search) {
      mockActivities = mockActivities.filter(activity => 
        activity.description.toLowerCase().includes(search.toLowerCase()) ||
        activity.userName?.toLowerCase().includes(search.toLowerCase()) ||
        activity.ipAddress.includes(search)
      );
    }

    // Apply time filter
    if (timeRange !== 'all') {
      const now = new Date();
      let timeFilter;
      
      switch (timeRange) {
        case '1h':
          timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (timeFilter) {
        mockActivities = mockActivities.filter(activity => 
          new Date(activity.createdAt) >= timeFilter
        );
      }
    }

    // Apply pagination
    const total = mockActivities.length;
    const offset = (page - 1) * limit;
    const paginatedActivities = mockActivities.slice(offset, offset + limit);

    return json({
      activities: paginatedActivities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
