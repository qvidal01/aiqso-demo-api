import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  saveWorkflow,
  getWorkflow,
  listWorkflows,
  deleteWorkflow,
  saveWorkflowExecution,
  updateWorkflowExecution,
} from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import { Workflow, WorkflowExecution, WorkflowExecutionStep } from '../types/index.js';

const config = getConfig();

const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'action', 'condition', 'delay']),
  label: z.string(),
  config: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
});

const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

const workflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  nodes: z.array(workflowNodeSchema).min(1).max(config.demo.maxWorkflowSteps),
  edges: z.array(workflowEdgeSchema),
});

export default async function workflowRoutes(fastify: FastifyInstance) {
  // Create workflow
  fastify.post('/workflows', async (request: any, reply) => {
    try {
      const data = workflowSchema.parse(request.body);

      const workflow: Workflow = {
        id: `workflow_${nanoid()}`,
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        edges: data.edges,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: request.user?.uid,
      };

      await saveWorkflow(workflow);

      logger.info('Workflow created', { workflowId: workflow.id });

      return reply.send({
        success: true,
        data: workflow,
      });
    } catch (error: any) {
      logger.error('Workflow creation failed', { error: error.message });

      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create workflow',
      });
    }
  });

  // Get workflow by ID
  fastify.get('/workflows/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;

      const workflow = await getWorkflow(id);

      if (!workflow) {
        return reply.status(404).send({
          success: false,
          error: 'Workflow not found',
        });
      }

      return reply.send({
        success: true,
        data: workflow,
      });
    } catch (error: any) {
      logger.error('Failed to get workflow', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve workflow',
      });
    }
  });

  // List workflows
  fastify.get('/workflows', async (request: any, reply) => {
    try {
      const userId = request.user?.uid;
      const workflows = await listWorkflows(userId);

      return reply.send({
        success: true,
        data: workflows,
      });
    } catch (error: any) {
      logger.error('Failed to list workflows', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to list workflows',
      });
    }
  });

  // Update workflow
  fastify.put('/workflows/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const data = workflowSchema.parse(request.body);

      const existing = await getWorkflow(id);

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Workflow not found',
        });
      }

      const workflow: Workflow = {
        ...existing,
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        edges: data.edges,
        updatedAt: new Date(),
      };

      await saveWorkflow(workflow);

      logger.info('Workflow updated', { workflowId: id });

      return reply.send({
        success: true,
        data: workflow,
      });
    } catch (error: any) {
      logger.error('Workflow update failed', { error: error.message });

      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to update workflow',
      });
    }
  });

  // Delete workflow
  fastify.delete('/workflows/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;

      await deleteWorkflow(id);

      return reply.send({
        success: true,
        message: 'Workflow deleted',
      });
    } catch (error: any) {
      logger.error('Workflow deletion failed', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete workflow',
      });
    }
  });

  // Execute workflow
  fastify.post('/workflows/:id/execute', async (request: any, reply) => {
    try {
      const { id } = request.params;

      const workflow = await getWorkflow(id);

      if (!workflow) {
        return reply.status(404).send({
          success: false,
          error: 'Workflow not found',
        });
      }

      const execution: WorkflowExecution = {
        id: `exec_${nanoid()}`,
        workflowId: id,
        status: 'running',
        startedAt: new Date(),
        steps: workflow.nodes.map((node) => ({
          nodeId: node.id,
          status: 'pending',
        })),
      };

      await saveWorkflowExecution(execution);

      // Execute workflow (simplified simulation)
      const executedSteps = await simulateWorkflowExecution(workflow, execution.steps);

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.steps = executedSteps;

      await updateWorkflowExecution(execution.id, {
        status: execution.status,
        completedAt: execution.completedAt,
        steps: execution.steps,
      });

      logger.info('Workflow executed', { executionId: execution.id });

      return reply.send({
        success: true,
        data: execution,
      });
    } catch (error: any) {
      logger.error('Workflow execution failed', { error: error.message });

      return reply.status(500).send({
        success: false,
        error: error.message || 'Workflow execution failed',
      });
    }
  });

  // Get workflow templates
  fastify.get('/workflows/templates', async (request, reply) => {
    const templates = [
      {
        id: 'lead-to-crm',
        name: 'Lead to CRM',
        description: 'Automatically add new leads to CRM and notify sales team',
        category: 'sales',
        nodes: [
          {
            id: '1',
            type: 'trigger',
            label: 'Form Submitted',
            config: { form: 'Contact Form' },
            position: { x: 100, y: 100 },
          },
          {
            id: '2',
            type: 'action',
            label: 'Create CRM Contact',
            config: { platform: 'salesforce' },
            position: { x: 300, y: 100 },
          },
          {
            id: '3',
            type: 'action',
            label: 'Send Email to Sales',
            config: { to: 'sales@company.com' },
            position: { x: 500, y: 100 },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
        ],
      },
      {
        id: 'support-ticket',
        name: 'Support Ticket Automation',
        description: 'Auto-respond to support tickets and create tasks',
        category: 'support',
        nodes: [
          {
            id: '1',
            type: 'trigger',
            label: 'Email Received',
            config: { inbox: 'support@' },
            position: { x: 100, y: 100 },
          },
          {
            id: '2',
            type: 'action',
            label: 'Send Auto-Reply',
            config: { template: 'support-ack' },
            position: { x: 300, y: 100 },
          },
          {
            id: '3',
            type: 'condition',
            label: 'Priority Check',
            config: { field: 'priority', value: 'high' },
            position: { x: 500, y: 100 },
          },
          {
            id: '4',
            type: 'action',
            label: 'Notify Team',
            config: { channel: '#support-urgent' },
            position: { x: 700, y: 50 },
          },
          {
            id: '5',
            type: 'action',
            label: 'Create Ticket',
            config: { system: 'zendesk' },
            position: { x: 700, y: 150 },
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4', label: 'Yes' },
          { id: 'e3-5', source: '3', target: '5', label: 'No' },
        ],
      },
    ];

    return reply.send({
      success: true,
      data: templates,
    });
  });
}

// Simulate workflow execution
async function simulateWorkflowExecution(
  workflow: Workflow,
  steps: WorkflowExecutionStep[]
): Promise<WorkflowExecutionStep[]> {
  const executedSteps = [...steps];

  for (let i = 0; i < executedSteps.length; i++) {
    const step = executedSteps[i];
    const node = workflow.nodes.find((n) => n.id === step.nodeId);

    if (!node) continue;

    step.status = 'running';
    step.startedAt = new Date();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    step.status = 'completed';
    step.completedAt = new Date();
    step.output = {
      nodeType: node.type,
      label: node.label,
      simulated: true,
      result: `${node.label} executed successfully`,
    };
  }

  return executedSteps;
}
