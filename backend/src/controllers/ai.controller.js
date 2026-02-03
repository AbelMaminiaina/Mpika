/**
 * AI Controller
 * Handles conversation with the AI assistant
 */

const axios = require('axios');
const { prisma } = require('../config/database');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const scheduleService = require('../services/schedule.service');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Chat with AI assistant
 * POST /api/ai/chat
 */
const chat = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message || !message.trim()) {
    throw ApiError.badRequest('Message is required');
  }

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound('Conversation not found');
    }
  } else {
    conversation = await prisma.conversation.create({
      data: {
        userId: req.userId,
      },
      include: {
        messages: true,
      },
    });
  }

  // Get user context (tasks, schedule, profile)
  const context = await getUserContext(req.userId);

  // Save user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  try {
    // Call AI service
    const aiResponse = await callAIService(
      message,
      conversation.messages,
      context
    );

    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponse.content,
      },
    });

    sendSuccess(res, {
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: 'ASSISTANT',
        content: aiResponse.content,
        createdAt: assistantMessage.createdAt,
      },
      suggestions: aiResponse.suggestions || [],
    });
  } catch (error) {
    logger.error('AI service error:', error);

    // Fallback response if AI service is unavailable
    const fallbackResponse = generateFallbackResponse(message, context);

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: fallbackResponse,
      },
    });

    sendSuccess(res, {
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: 'ASSISTANT',
        content: fallbackResponse,
        createdAt: assistantMessage.createdAt,
      },
      suggestions: [],
    });
  }
});

/**
 * Get AI suggestions
 * POST /api/ai/suggest
 */
const suggest = asyncHandler(async (req, res) => {
  const { type } = req.body; // 'schedule', 'tasks', 'wellbeing'

  const context = await getUserContext(req.userId);

  let suggestions = [];

  switch (type) {
    case 'schedule':
      suggestions = generateScheduleSuggestions(context);
      break;
    case 'tasks':
      suggestions = generateTaskSuggestions(context);
      break;
    case 'wellbeing':
      suggestions = generateWellbeingSuggestions(context);
      break;
    default:
      suggestions = [
        ...generateScheduleSuggestions(context).slice(0, 2),
        ...generateTaskSuggestions(context).slice(0, 2),
        ...generateWellbeingSuggestions(context).slice(0, 1),
      ];
  }

  sendSuccess(res, { suggestions });
});

/**
 * Get user conversations
 * GET /api/ai/conversations
 */
const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: req.userId },
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.conversation.count({ where: { userId: req.userId } }),
  ]);

  // Format conversations with preview
  const formatted = conversations.map(conv => ({
    id: conv.id,
    preview: conv.messages[0]?.content.substring(0, 100) + '...',
    lastMessage: conv.messages[0]?.createdAt,
    createdAt: conv.createdAt,
  }));

  sendPaginated(res, formatted, parseInt(page), parseInt(limit), total);
});

/**
 * Get single conversation
 * GET /api/ai/conversations/:id
 */
const getConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: req.userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  sendSuccess(res, conversation);
});

/**
 * Delete conversation
 * DELETE /api/ai/conversations/:id
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: req.userId,
    },
  });

  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }

  await prisma.conversation.delete({
    where: { id },
  });

  sendSuccess(res, null, 'Conversation deleted');
});

// Helper functions

async function getUserContext(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [profile, pendingTasks, todaySchedule] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.task.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
      take: 10,
    }),
    prisma.schedule.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      include: {
        items: true,
      },
    }),
  ]);

  const mentalLoad = todaySchedule
    ? scheduleService.calculateMentalLoad(todaySchedule.items)
    : 0;

  return {
    profile,
    pendingTasks,
    todaySchedule,
    mentalLoad,
    mentalLoadLevel: scheduleService.getMentalLoadLevel(mentalLoad),
  };
}

async function callAIService(message, previousMessages, context) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
    message,
    history: previousMessages.map(m => ({
      role: m.role.toLowerCase(),
      content: m.content,
    })),
    context: {
      pendingTasksCount: context.pendingTasks.length,
      mentalLoad: context.mentalLoad,
      mentalLoadLevel: context.mentalLoadLevel,
      energyPeakTime: context.profile?.energyPeakTime,
      upcomingTasks: context.pendingTasks.slice(0, 5).map(t => ({
        title: t.title,
        priority: t.priority,
        deadline: t.deadline,
      })),
    },
  }, {
    timeout: 30000,
  });

  return response.data;
}

function generateFallbackResponse(message, context) {
  const messageLower = message.toLowerCase();

  // Check for common intents
  if (messageLower.includes('bonjour') || messageLower.includes('salut')) {
    return `Bonjour ! Je suis Mpikarakara, ton assistant de gestion du temps. Comment puis-je t'aider aujourd'hui ?`;
  }

  if (messageLower.includes('charge') || messageLower.includes('stress')) {
    const level = context.mentalLoadLevel;
    if (level === 'overloaded' || level === 'critical') {
      return `Je vois que ta charge mentale est actuellement ${context.mentalLoad}/10 (${level}). C'est beaucoup ! Je te suggère de reporter certaines tâches non urgentes et de prendre des pauses régulières. Veux-tu que je t'aide à réorganiser ton planning ?`;
    }
    return `Ta charge mentale actuelle est de ${context.mentalLoad}/10 (${level}). C'est ${level === 'balanced' ? 'bien équilibré' : 'gérable'}. N'hésite pas à me demander si tu as besoin d'ajuster ton planning.`;
  }

  if (messageLower.includes('tâche') || messageLower.includes('faire')) {
    if (context.pendingTasks.length === 0) {
      return `Tu n'as pas de tâches en attente. Profite de ce moment de calme ! Veux-tu ajouter une nouvelle tâche ?`;
    }
    const taskList = context.pendingTasks.slice(0, 3).map(t => `- ${t.title}`).join('\n');
    return `Tu as ${context.pendingTasks.length} tâches en attente. Voici les plus importantes :\n${taskList}\n\nVeux-tu que je t'aide à les planifier ?`;
  }

  if (messageLower.includes('planning') || messageLower.includes('organiser')) {
    return `Je peux t'aider à optimiser ton planning ! Pour cela, dis-moi :\n1. Quelles sont tes tâches prioritaires ?\n2. As-tu des contraintes horaires ?\n3. Comment te sens-tu aujourd'hui ?`;
  }

  // Default response
  return `Je suis là pour t'aider à mieux gérer ton temps et réduire ta charge mentale. Tu peux me demander :\n- D'organiser ton planning\n- De vérifier ta charge mentale\n- Des conseils de productivité\n- D'ajouter ou gérer tes tâches\n\nQue veux-tu faire ?`;
}

function generateScheduleSuggestions(context) {
  const suggestions = [];

  if (context.mentalLoad > 7) {
    suggestions.push({
      type: 'warning',
      title: 'Surcharge détectée',
      message: 'Ta journée semble surchargée. Je te recommande de reporter certaines tâches.',
      action: 'optimize_schedule',
    });
  }

  if (context.todaySchedule?.items.filter(i => i.type === 'BREAK').length < 2) {
    suggestions.push({
      type: 'tip',
      title: 'Ajouter des pauses',
      message: 'Tu n\'as pas assez de pauses planifiées. Les pauses améliorent la productivité.',
      action: 'add_breaks',
    });
  }

  return suggestions;
}

function generateTaskSuggestions(context) {
  const suggestions = [];

  const urgentTasks = context.pendingTasks.filter(t => t.priority === 'URGENT');
  if (urgentTasks.length > 0) {
    suggestions.push({
      type: 'urgent',
      title: `${urgentTasks.length} tâche(s) urgente(s)`,
      message: `N'oublie pas : ${urgentTasks[0].title}`,
      action: 'view_urgent_tasks',
    });
  }

  const overdueTasks = context.pendingTasks.filter(t =>
    t.deadline && new Date(t.deadline) < new Date()
  );
  if (overdueTasks.length > 0) {
    suggestions.push({
      type: 'warning',
      title: 'Tâches en retard',
      message: `Tu as ${overdueTasks.length} tâche(s) dont la deadline est dépassée.`,
      action: 'view_overdue_tasks',
    });
  }

  return suggestions;
}

function generateWellbeingSuggestions(context) {
  const suggestions = [];
  const hour = new Date().getHours();

  if (hour >= 12 && hour <= 14) {
    suggestions.push({
      type: 'reminder',
      title: 'Pause déjeuner',
      message: 'As-tu pris ta pause déjeuner ? Manger correctement est important.',
      action: 'acknowledge',
    });
  }

  if (hour >= 18) {
    suggestions.push({
      type: 'tip',
      title: 'Fin de journée',
      message: 'Pense à déconnecter du travail et à te reposer.',
      action: 'acknowledge',
    });
  }

  if (context.mentalLoadLevel === 'overloaded' || context.mentalLoadLevel === 'critical') {
    suggestions.push({
      type: 'wellbeing',
      title: 'Prends soin de toi',
      message: 'Ta charge mentale est élevée. Prends une pause de 15 minutes pour respirer.',
      action: 'start_break',
    });
  }

  return suggestions;
}

module.exports = {
  chat,
  suggest,
  getConversations,
  getConversation,
  deleteConversation,
};
