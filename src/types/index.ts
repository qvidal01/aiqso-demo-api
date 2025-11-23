// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Demo Session Types
export interface DemoSession {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  userId?: string;
  metadata: Record<string, any>;
}

// Automation Types
export interface AutomationRequest {
  service: string;
  deliveryMethod: 'email' | 'sms' | 'call' | 'calendar' | 'webhook';
  recipient: string;
  payload: Record<string, any>;
  simulate?: boolean;
}

export interface AutomationResult {
  id: string;
  status: 'success' | 'failed' | 'simulated';
  deliveryMethod: string;
  timestamp: Date;
  details: string;
  metadata?: Record<string, any>;
}

// Workflow Types
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  steps: WorkflowExecutionStep[];
  error?: string;
}

export interface WorkflowExecutionStep {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
}

// AI Chat Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  context?: 'workflow' | 'automation' | 'general';
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
  workflow?: Partial<Workflow>;
}

// Service Catalog Types
export interface ServiceDefinition {
  id: string;
  name: string;
  category: 'crm' | 'marketing' | 'operations' | 'support';
  description: string;
  icon: string;
  supportedDeliveryMethods: Array<'email' | 'sms' | 'call' | 'calendar' | 'webhook'>;
  demoTemplate: Record<string, any>;
}

// Dashboard Types
export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  format: 'number' | 'currency' | 'percentage';
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// Email Types
export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
}

// Calendar Types
export interface CalendarEventPayload {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
}

// Simulation Types
export interface SimulationResult {
  simulated: true;
  action: string;
  recipient: string;
  preview: string;
  wouldHappen: string;
  technicalDetails?: Record<string, any>;
}
