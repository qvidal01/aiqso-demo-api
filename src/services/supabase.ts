import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { Workflow, WorkflowExecution, DemoSession, AutomationResult } from '../types/index.js';

const config = getConfig();

export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Demo Sessions
export const createDemoSession = async (
  userId?: string,
  metadata: Record<string, any> = {}
): Promise<DemoSession> => {
  const session: DemoSession = {
    id: `session_${Date.now()}`,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + config.demo.sessionDuration),
    userId,
    metadata,
  };

  const { error } = await supabase.from('demo_sessions').insert([
    {
      id: session.id,
      user_id: session.userId,
      created_at: session.createdAt.toISOString(),
      expires_at: session.expiresAt.toISOString(),
      metadata: session.metadata,
    },
  ]);

  if (error) {
    logger.error('Failed to create demo session', { error });
    throw new Error('Failed to create demo session');
  }

  logger.info('Demo session created', { sessionId: session.id });
  return session;
};

export const getDemoSession = async (sessionId: string): Promise<DemoSession | null> => {
  const { data, error } = await supabase
    .from('demo_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
    userId: data.user_id,
    metadata: data.metadata,
  };
};

// Workflows
export const saveWorkflow = async (workflow: Workflow): Promise<void> => {
  const { error } = await supabase.from('workflows').upsert([
    {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      edges: workflow.edges,
      user_id: workflow.userId,
      created_at: workflow.createdAt.toISOString(),
      updated_at: workflow.updatedAt.toISOString(),
    },
  ]);

  if (error) {
    logger.error('Failed to save workflow', { error, workflowId: workflow.id });
    throw new Error('Failed to save workflow');
  }

  logger.info('Workflow saved', { workflowId: workflow.id });
};

export const getWorkflow = async (workflowId: string): Promise<Workflow | null> => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    nodes: data.nodes,
    edges: data.edges,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const listWorkflows = async (userId?: string, limit = 50): Promise<Workflow[]> => {
  let query = supabase.from('workflows').select('*').order('updated_at', { ascending: false }).limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    nodes: w.nodes,
    edges: w.edges,
    userId: w.user_id,
    createdAt: new Date(w.created_at),
    updatedAt: new Date(w.updated_at),
  }));
};

export const deleteWorkflow = async (workflowId: string): Promise<void> => {
  const { error } = await supabase.from('workflows').delete().eq('id', workflowId);

  if (error) {
    logger.error('Failed to delete workflow', { error, workflowId });
    throw new Error('Failed to delete workflow');
  }

  logger.info('Workflow deleted', { workflowId });
};

// Workflow Executions
export const saveWorkflowExecution = async (execution: WorkflowExecution): Promise<void> => {
  const { error } = await supabase.from('workflow_executions').insert([
    {
      id: execution.id,
      workflow_id: execution.workflowId,
      status: execution.status,
      started_at: execution.startedAt.toISOString(),
      completed_at: execution.completedAt?.toISOString(),
      steps: execution.steps,
      error: execution.error,
    },
  ]);

  if (error) {
    logger.error('Failed to save workflow execution', { error, executionId: execution.id });
    throw new Error('Failed to save workflow execution');
  }

  logger.info('Workflow execution saved', { executionId: execution.id });
};

export const updateWorkflowExecution = async (
  executionId: string,
  updates: Partial<WorkflowExecution>
): Promise<void> => {
  const updateData: any = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
  if (updates.steps) updateData.steps = updates.steps;
  if (updates.error) updateData.error = updates.error;

  const { error } = await supabase
    .from('workflow_executions')
    .update(updateData)
    .eq('id', executionId);

  if (error) {
    logger.error('Failed to update workflow execution', { error, executionId });
  }
};

// Automation Results
export const saveAutomationResult = async (result: AutomationResult): Promise<void> => {
  const { error } = await supabase.from('automation_results').insert([
    {
      id: result.id,
      status: result.status,
      delivery_method: result.deliveryMethod,
      timestamp: result.timestamp.toISOString(),
      details: result.details,
      metadata: result.metadata,
    },
  ]);

  if (error) {
    logger.error('Failed to save automation result', { error });
  }
};

// Analytics
export const getAnalytics = async () => {
  const { count: sessionCount } = await supabase
    .from('demo_sessions')
    .select('*', { count: 'exact', head: true });

  const { count: workflowCount } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true });

  const { count: executionCount } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true });

  const { count: automationCount } = await supabase
    .from('automation_results')
    .select('*', { count: 'exact', head: true });

  return {
    totalSessions: sessionCount || 0,
    totalWorkflows: workflowCount || 0,
    totalExecutions: executionCount || 0,
    totalAutomations: automationCount || 0,
  };
};

// Cleanup old demo data
export const cleanupOldDemoData = async (): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.demo.autoDeleteDays);

  const { error } = await supabase
    .from('demo_sessions')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    logger.error('Failed to cleanup old demo data', { error });
  } else {
    logger.info('Old demo data cleaned up', { cutoffDate });
  }
};
