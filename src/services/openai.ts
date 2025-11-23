import OpenAI from 'openai';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { ChatMessage, ChatRequest, ChatResponse, Workflow } from '../types/index.js';
import { nanoid } from 'nanoid';

const config = getConfig();

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const SYSTEM_PROMPT = `You are Cyberque, an AI assistant for AIQSO's automation platform demo.

Your role:
- Help users understand automation possibilities
- Guide them through creating workflows
- Suggest practical automation scenarios
- Explain how integrations work

When users describe what they want to automate:
1. Ask clarifying questions if needed
2. Suggest a workflow structure
3. Explain the benefits
4. Offer to create a visual workflow

Be friendly, concise, and focus on practical business value.

Available integrations: Email, SMS, Calendar, CRM (Salesforce, HubSpot), Support (Zendesk, Intercom), Marketing (Mailchimp, ActiveCampaign), Webhooks.

Available triggers: Webhook, Schedule, Email received, Form submission, Database change.
Available actions: Send email, Send SMS, Create task, Update CRM, Post to Slack, API call.
Available conditions: If/then logic, Data validation, Date/time checks.`;

let monthlyTokenUsage = 0;
let lastTokenResetDate = new Date().toISOString().slice(0, 7); // YYYY-MM

const estimateTokens = (text: string): number => {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
};

const checkMonthlyBudget = (estimatedTokens: number): boolean => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (currentMonth !== lastTokenResetDate) {
    monthlyTokenUsage = 0;
    lastTokenResetDate = currentMonth;
  }

  // GPT-4o-mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens
  // Assuming average 50/50 split, ~$0.375 per 1M tokens
  // $10 budget = ~26.6M tokens
  const budgetTokens = (config.budget.openaiMonthly / 0.375) * 1_000_000;

  return monthlyTokenUsage + estimatedTokens < budgetTokens;
};

export const chat = async (request: ChatRequest): Promise<ChatResponse> => {
  try {
    const conversationId = request.conversationId || nanoid();

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: request.message },
    ];

    const estimatedTokens = estimateTokens(
      messages.map((m) => m.content).join(' ')
    );

    if (!checkMonthlyBudget(estimatedTokens)) {
      return {
        message:
          "I'm currently at my monthly usage limit. Please try again next month, or contact AIQSO for immediate assistance at demo@aiqso.io",
        conversationId,
        suggestions: ['Contact Sales', 'View Pre-built Workflows', 'Schedule Demo'],
      };
    }

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    const usage = completion.usage;
    if (usage) {
      monthlyTokenUsage += usage.total_tokens;
      logger.debug('OpenAI usage', {
        tokens: usage.total_tokens,
        monthlyTotal: monthlyTokenUsage,
      });
    }

    const response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';

    // Check if the response suggests creating a workflow
    const suggestsWorkflow = response.toLowerCase().includes('workflow') ||
                            response.toLowerCase().includes('automate');

    const suggestions: string[] = [];
    if (suggestsWorkflow) {
      suggestions.push('Create Workflow', 'Show Example', 'Explain More');
    } else {
      suggestions.push('Tell Me More', 'Show Demo', 'Create Automation');
    }

    logger.info('Chat completed', {
      conversationId,
      tokens: usage?.total_tokens,
      context: request.context,
    });

    return {
      message: response,
      conversationId,
      suggestions,
    };
  } catch (error: any) {
    logger.error('OpenAI chat failed', { error: error.message, request });

    return {
      message:
        'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
      conversationId: request.conversationId || nanoid(),
      suggestions: ['Try Again', 'Contact Support'],
    };
  }
};

export const generateWorkflow = async (
  description: string
): Promise<Partial<Workflow> | null> => {
  try {
    const prompt = `Based on this automation request, generate a workflow JSON structure:

"${description}"

Return a JSON object with:
- name: Workflow name
- description: Brief description
- nodes: Array of {id, type, label, config, position}
- edges: Array of {id, source, target}

Types: trigger, action, condition, delay
Keep it simple (3-6 nodes).`;

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.5,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return null;

    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const workflow = JSON.parse(jsonMatch[0]);

    logger.info('Workflow generated', { description });

    return workflow;
  } catch (error: any) {
    logger.error('Workflow generation failed', { error: error.message });
    return null;
  }
};

export const getUsageStats = () => ({
  monthlyTokens: monthlyTokenUsage,
  monthlyBudget: config.budget.openaiMonthly,
  resetDate: lastTokenResetDate,
});
