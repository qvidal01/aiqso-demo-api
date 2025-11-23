import { FastifyInstance } from 'fastify';
import { getAnalytics } from '../services/supabase.js';
import { getDailyEmailStats } from '../services/sendgrid.js';
import { getUsageStats as getOpenAIStats } from '../services/openai.js';
import { DashboardMetric, ChartData } from '../types/index.js';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard metrics
  fastify.get('/dashboard/metrics', async (request, reply) => {
    try {
      const analytics = await getAnalytics();
      const emailStats = getDailyEmailStats();
      const aiStats = getOpenAIStats();

      const metrics: DashboardMetric[] = [
        {
          id: 'sessions',
          label: 'Demo Sessions',
          value: analytics.totalSessions,
          change: 12.5,
          changeType: 'increase',
          format: 'number',
        },
        {
          id: 'workflows',
          label: 'Workflows Created',
          value: analytics.totalWorkflows,
          change: 8.3,
          changeType: 'increase',
          format: 'number',
        },
        {
          id: 'executions',
          label: 'Workflow Executions',
          value: analytics.totalExecutions,
          change: 15.7,
          changeType: 'increase',
          format: 'number',
        },
        {
          id: 'automations',
          label: 'Automations Run',
          value: analytics.totalAutomations,
          change: 23.1,
          changeType: 'increase',
          format: 'number',
        },
      ];

      return reply.send({
        success: true,
        data: {
          metrics,
          emailStats,
          aiStats,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard metrics',
      });
    }
  });

  // Get chart data (mock data for demo)
  fastify.get('/dashboard/charts', async (request, reply) => {
    // Generate mock data for the last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const revenueData: ChartData = {
      labels: days,
      datasets: [
        {
          label: 'Revenue',
          data: [12500, 15300, 18200, 14800, 21000, 19500, 23400],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
        },
      ],
    };

    const customerData: ChartData = {
      labels: days,
      datasets: [
        {
          label: 'New Customers',
          data: [8, 12, 15, 10, 18, 14, 20],
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
        },
      ],
    };

    const automationData: ChartData = {
      labels: days,
      datasets: [
        {
          label: 'Automations',
          data: [45, 52, 61, 58, 73, 68, 82],
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          borderColor: 'rgb(168, 85, 247)',
        },
      ],
    };

    const categoryData: ChartData = {
      labels: ['CRM', 'Marketing', 'Support', 'Operations'],
      datasets: [
        {
          label: 'Usage by Category',
          data: [35, 28, 22, 15],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
        },
      ],
    };

    return reply.send({
      success: true,
      data: {
        revenue: revenueData,
        customers: customerData,
        automations: automationData,
        categories: categoryData,
      },
    });
  });

  // Get activity feed (mock data)
  fastify.get('/dashboard/activity', async (request, reply) => {
    const activities = [
      {
        id: 1,
        type: 'workflow',
        action: 'created',
        user: 'Demo User',
        description: 'Created workflow "Lead to CRM"',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 2,
        type: 'automation',
        action: 'executed',
        user: 'Demo User',
        description: 'Sent email notification',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 3,
        type: 'workflow',
        action: 'executed',
        user: 'Demo User',
        description: 'Executed "Support Ticket Automation"',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 4,
        type: 'chat',
        action: 'conversation',
        user: 'Demo User',
        description: 'Started conversation with Cyberque',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 5,
        type: 'automation',
        action: 'simulated',
        user: 'Demo User',
        description: 'Simulated SMS notification',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ];

    return reply.send({
      success: true,
      data: activities,
    });
  });
}
