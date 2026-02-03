/**
 * Schedule Service
 * Core scheduling algorithms and mental load calculations
 */

// Category weights for mental load calculation
const CATEGORY_WEIGHTS = {
  WORK: 1.5,
  STUDY: 1.4,
  HOUSEHOLD: 1.0,
  PERSONAL: 0.9,
  SPORT: 0.8,
  SOCIAL: 0.6,
  LEISURE: 0.5,
  REST: 0.2,
};

// Priority multipliers
const PRIORITY_MULTIPLIERS = {
  URGENT: 1.3,
  HIGH: 1.2,
  MEDIUM: 1.0,
  LOW: 0.8,
};

// Energy level by time of day
const TIME_ENERGY_LEVELS = {
  morning: { start: 6, end: 12, level: 'high' },
  afternoon: { start: 12, end: 17, level: 'medium' },
  evening: { start: 17, end: 22, level: 'low' },
};

/**
 * Calculate mental load score for schedule items
 * @param {Array} items - Schedule items
 * @returns {number} Mental load score (0-10)
 */
function calculateMentalLoad(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  let totalWeightedDuration = 0;

  for (const item of items) {
    // Skip breaks, buffers, and sleep
    if (['BREAK', 'BUFFER', 'SLEEP', 'LUNCH'].includes(item.type)) {
      continue;
    }

    // Calculate duration in hours
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);

    // Get category weight
    let category = 'WORK';
    if (item.task) {
      category = item.task.category;
    } else if (item.title) {
      // Try to infer category from title keywords
      const titleLower = item.title.toLowerCase();
      if (titleLower.includes('repos') || titleLower.includes('rest')) {
        category = 'REST';
      } else if (titleLower.includes('sport') || titleLower.includes('exercise')) {
        category = 'SPORT';
      } else if (titleLower.includes('loisir') || titleLower.includes('leisure')) {
        category = 'LEISURE';
      }
    }

    const weight = CATEGORY_WEIGHTS[category] || 1.0;

    // Get priority multiplier
    let priorityMultiplier = 1.0;
    if (item.task) {
      priorityMultiplier = PRIORITY_MULTIPLIERS[item.task.priority] || 1.0;
    }

    totalWeightedDuration += durationHours * weight * priorityMultiplier;
  }

  // Calculate score based on 12-hour max productive day
  const MAX_PRODUCTIVE_HOURS = 12;
  const score = (totalWeightedDuration / MAX_PRODUCTIVE_HOURS) * 10;

  // Cap at 10
  return Math.min(Math.round(score * 10) / 10, 10);
}

/**
 * Get mental load level description
 * @param {number} score - Mental load score
 * @returns {string} Level description
 */
function getMentalLoadLevel(score) {
  if (score <= 3) return 'light';
  if (score <= 5) return 'balanced';
  if (score <= 7) return 'busy';
  if (score <= 9) return 'overloaded';
  return 'critical';
}

/**
 * Analyze mental load and provide insights
 * @param {number} score - Mental load score
 * @param {Array} items - Schedule items
 * @returns {Object} Analysis result
 */
function analyzeMentalLoad(score, items) {
  const level = getMentalLoadLevel(score);

  const messages = {
    light: 'Journée très légère. Tu as de la marge pour ajouter des activités ou profiter de ton temps libre.',
    balanced: 'Journée équilibrée. Bon équilibre entre activités et repos.',
    busy: 'Journée chargée mais gérable. Assure-toi de prendre tes pauses.',
    overloaded: 'Attention, journée surchargée. Je te recommande de reporter certaines tâches.',
    critical: 'Surcharge critique! Il faut absolument alléger cette journée.',
  };

  const result = {
    level,
    message: messages[level],
    suggestions: [],
  };

  // Add specific suggestions based on score
  if (score > 7) {
    result.suggestions = generateOverloadSuggestions(score, items);
  }

  // Calculate time distribution
  result.distribution = calculateTimeDistribution(items);

  return result;
}

/**
 * Calculate time distribution by category
 * @param {Array} items - Schedule items
 * @returns {Object} Time distribution
 */
function calculateTimeDistribution(items) {
  const distribution = {};
  let totalMinutes = 0;

  for (const item of items) {
    if (['BREAK', 'BUFFER', 'SLEEP'].includes(item.type)) {
      continue;
    }

    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    const durationMinutes = (endTime - startTime) / (1000 * 60);

    let category = 'OTHER';
    if (item.task) {
      category = item.task.category;
    } else if (item.type === 'LUNCH') {
      category = 'REST';
    }

    distribution[category] = (distribution[category] || 0) + durationMinutes;
    totalMinutes += durationMinutes;
  }

  // Convert to percentages
  const result = {};
  for (const [category, minutes] of Object.entries(distribution)) {
    result[category] = {
      minutes,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    };
  }

  return result;
}

/**
 * Generate suggestions to reduce overload
 * @param {number} score - Mental load score
 * @param {Array} items - Schedule items
 * @returns {Array} Suggestions
 */
function generateOverloadSuggestions(score, items) {
  const suggestions = [];

  // Count tasks by priority
  const taskItems = items.filter(i => i.type === 'TASK' && i.task);
  const lowPriorityTasks = taskItems.filter(i => i.task.priority === 'LOW');
  const mediumPriorityTasks = taskItems.filter(i => i.task.priority === 'MEDIUM');

  // Suggest postponing low priority tasks
  if (lowPriorityTasks.length > 0) {
    suggestions.push({
      type: 'postpone',
      message: `Reporter ${lowPriorityTasks.length} tâche(s) de faible priorité à demain`,
      impact: -0.5 * lowPriorityTasks.length,
      tasks: lowPriorityTasks.map(t => t.task.title),
    });
  }

  // Suggest shortening medium priority tasks
  if (mediumPriorityTasks.length > 0 && score > 8) {
    suggestions.push({
      type: 'shorten',
      message: 'Réduire la durée des tâches moyennes de 20%',
      impact: -0.8,
    });
  }

  // Suggest adding more breaks
  const breakCount = items.filter(i => i.type === 'BREAK').length;
  if (breakCount < 3) {
    suggestions.push({
      type: 'breaks',
      message: 'Ajouter plus de pauses pour récupérer',
      impact: -0.3,
    });
  }

  // Suggest moving tasks to tomorrow
  if (score > 9) {
    suggestions.push({
      type: 'reschedule',
      message: 'Déplacer au moins une tâche importante à demain',
      impact: -1.5,
    });
  }

  return suggestions;
}

/**
 * Optimize schedule based on tasks and user profile
 * @param {Array} tasks - Tasks to schedule
 * @param {Object} profile - User profile
 * @param {Date} date - Target date
 * @returns {Array} Optimized schedule items
 */
function optimizeSchedule(tasks, profile, date) {
  const items = [];

  // Parse wake up and bed time
  const [wakeHour, wakeMin] = (profile.wakeUpTime || '07:00').split(':').map(Number);
  const [bedHour, bedMin] = (profile.bedTime || '23:00').split(':').map(Number);

  // Create time slots (30-minute intervals)
  const slots = [];
  let currentHour = wakeHour;
  let currentMin = wakeMin;

  while (currentHour < bedHour || (currentHour === bedHour && currentMin < bedMin)) {
    const slotStart = new Date(date);
    slotStart.setHours(currentHour, currentMin, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    slots.push({
      start: slotStart,
      end: slotEnd,
      occupied: false,
      energyLevel: getEnergyLevel(currentHour, profile.energyPeakTime),
    });

    currentMin += 30;
    if (currentMin >= 60) {
      currentHour++;
      currentMin = 0;
    }
  }

  // Add lunch break (12:00-13:00)
  const lunchStart = new Date(date);
  lunchStart.setHours(12, 0, 0, 0);
  const lunchEnd = new Date(date);
  lunchEnd.setHours(13, 0, 0, 0);

  items.push({
    title: 'Pause déjeuner',
    type: 'LUNCH',
    startTime: lunchStart,
    endTime: lunchEnd,
    taskId: null,
  });

  // Mark lunch slots as occupied
  slots.forEach(slot => {
    if (slot.start >= lunchStart && slot.end <= lunchEnd) {
      slot.occupied = true;
    }
  });

  // Sort tasks by scheduling priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // Urgent first
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by deadline
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;

    return 0;
  });

  // Schedule each task
  for (const task of sortedTasks) {
    const slotsNeeded = Math.ceil(task.duration / 30);
    const isIntensive = ['WORK', 'STUDY'].includes(task.category);

    // Find best slot based on task type and energy levels
    let bestSlotIndex = -1;
    let bestScore = -1;

    for (let i = 0; i <= slots.length - slotsNeeded; i++) {
      // Check if consecutive slots are available
      let allAvailable = true;
      for (let j = 0; j < slotsNeeded; j++) {
        if (slots[i + j].occupied) {
          allAvailable = false;
          break;
        }
      }

      if (!allAvailable) continue;

      // Calculate slot score
      let score = 0;

      // Energy level matching
      const energyLevel = slots[i].energyLevel;
      if (isIntensive) {
        // Intensive tasks prefer high energy times
        score += energyLevel === 'high' ? 3 : energyLevel === 'medium' ? 2 : 1;
      } else {
        // Light tasks can go anywhere, prefer medium/low energy times
        score += energyLevel === 'low' ? 3 : energyLevel === 'medium' ? 2 : 1;
      }

      // Prefer earlier slots for high priority
      if (task.priority === 'URGENT' || task.priority === 'HIGH') {
        score += (slots.length - i) / slots.length * 2;
      }

      // Consider preferred time
      if (task.preferredTime) {
        const slotHour = slots[i].start.getHours();
        if (task.preferredTime === 'morning' && slotHour < 12) score += 2;
        if (task.preferredTime === 'afternoon' && slotHour >= 12 && slotHour < 17) score += 2;
        if (task.preferredTime === 'evening' && slotHour >= 17) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestSlotIndex = i;
      }
    }

    if (bestSlotIndex >= 0) {
      // Mark slots as occupied
      for (let j = 0; j < slotsNeeded; j++) {
        slots[bestSlotIndex + j].occupied = true;
      }

      // Create schedule item
      const startTime = slots[bestSlotIndex].start;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + task.duration);

      items.push({
        title: task.title,
        type: 'TASK',
        startTime,
        endTime,
        taskId: task.id,
        task,
      });

      // Add break after intensive tasks longer than 1 hour
      if (isIntensive && task.duration >= 60) {
        const breakStart = new Date(endTime);
        const breakEnd = new Date(breakStart);
        breakEnd.setMinutes(breakEnd.getMinutes() + 15);

        // Check if break slot is available
        const breakSlotIndex = bestSlotIndex + slotsNeeded;
        if (breakSlotIndex < slots.length && !slots[breakSlotIndex].occupied) {
          slots[breakSlotIndex].occupied = true;

          items.push({
            title: 'Pause',
            type: 'BREAK',
            startTime: breakStart,
            endTime: breakEnd,
            taskId: null,
          });
        }
      }
    }
  }

  // Add buffer time between activities (5 min)
  const sortedItems = items.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const finalItems = [];

  for (let i = 0; i < sortedItems.length; i++) {
    const currentItem = sortedItems[i];
    finalItems.push(currentItem);

    // Add buffer if there's a next item and gap is sufficient
    if (i < sortedItems.length - 1) {
      const nextItem = sortedItems[i + 1];
      const gap = new Date(nextItem.startTime) - new Date(currentItem.endTime);

      if (gap >= 5 * 60 * 1000 && gap < 30 * 60 * 1000) {
        // Gap between 5-30 minutes: add a small buffer
        finalItems.push({
          title: 'Transition',
          type: 'BUFFER',
          startTime: currentItem.endTime,
          endTime: nextItem.startTime,
          taskId: null,
        });
      }
    }
  }

  return finalItems;
}

/**
 * Get energy level for a given hour
 * @param {number} hour - Hour of day
 * @param {string} peakTime - User's energy peak time preference
 * @returns {string} Energy level
 */
function getEnergyLevel(hour, peakTime) {
  // Adjust based on user preference
  if (peakTime === 'morning') {
    if (hour >= 6 && hour < 12) return 'high';
    if (hour >= 12 && hour < 17) return 'medium';
    return 'low';
  } else if (peakTime === 'afternoon') {
    if (hour >= 12 && hour < 17) return 'high';
    if (hour >= 6 && hour < 12) return 'medium';
    return 'low';
  } else if (peakTime === 'evening') {
    if (hour >= 17 && hour < 22) return 'high';
    if (hour >= 12 && hour < 17) return 'medium';
    return 'low';
  }

  // Default pattern
  if (hour >= 9 && hour < 12) return 'high';
  if (hour >= 14 && hour < 17) return 'medium';
  return 'low';
}

module.exports = {
  calculateMentalLoad,
  getMentalLoadLevel,
  analyzeMentalLoad,
  calculateTimeDistribution,
  generateOverloadSuggestions,
  optimizeSchedule,
  getEnergyLevel,
  CATEGORY_WEIGHTS,
  PRIORITY_MULTIPLIERS,
};
