import { Task, ScheduleBlock, UserPreferences, ScheduleConflict, RescheduleDiff } from '../types';
import { prioritizeTasks } from './prioritization';

/** Helper to convert "HH:MM" string to minutes from midnight */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Helper to convert minutes from midnight to "HH:MM" string */
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface ScheduleGenerationResult {
  blocks: ScheduleBlock[];
  conflicts: ScheduleConflict[];
  scheduledMinutes: number;
  remainingUnscheduledTasks: Task[];
  summary: string;
}

/**
 * Generates an optimized, conflict-free daily time-blocked schedule
 */
export function generateDailySchedule(
  tasks: Task[],
  preferences: UserPreferences,
  targetDate: string = new Date().toISOString().split('T')[0],
  existingCompletedBlocks: ScheduleBlock[] = []
): ScheduleGenerationResult {
  const conflicts: ScheduleConflict[] = [];
  const generatedBlocks: ScheduleBlock[] = [];

  // Filter tasks: incomplete and not blocked
  const incompleteTasks = tasks.filter((t) => t.status !== 'completed');
  const prioritized = prioritizeTasks(incompleteTasks);

  const startLimitMinutes = timeToMinutes(preferences.workStartTime || '09:00');
  const endLimitMinutes = timeToMinutes(preferences.workEndTime || '18:00');
  const maxDailyMinutes = Math.min(
    endLimitMinutes - startLimitMinutes,
    (preferences.dailyWorkloadLimitHours || 7) * 60
  );

  let currentMinutes = startLimitMinutes;
  let totalScheduledTaskMinutes = 0;
  let sessionIndex = 0;

  // Preserve existing completed blocks from today
  const todaysCompleted = existingCompletedBlocks.filter(
    (b) => b.date === targetDate && b.status === 'completed'
  );
  todaysCompleted.forEach((block) => {
    generatedBlocks.push(block);
    const blockEnd = timeToMinutes(block.endTime);
    if (blockEnd > currentMinutes) {
      currentMinutes = blockEnd;
    }
  });

  const unscheduledTasks: Task[] = [];
  const scheduledTaskIds = new Set<string>(todaysCompleted.map((b) => b.taskId).filter(Boolean) as string[]);

  for (const task of prioritized) {
    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const hasUnfinishedPrereq = task.dependencies.some(
        (depId) => !scheduledTaskIds.has(depId) && tasks.find((t) => t.id === depId)?.status !== 'completed'
      );
      if (hasUnfinishedPrereq) {
        conflicts.push({
          type: 'dependency_violation',
          taskId: task.id,
          message: `"${task.title}" was deferred because prerequisites are not yet completed or scheduled earlier.`,
          suggestedMitigation: 'Complete dependency tasks first.',
        });
        unscheduledTasks.push(task);
        continue;
      }
    }

    const taskDuration = task.estimatedMinutes || 30;

    // Check if adding this task exceeds daily limit
    if (totalScheduledTaskMinutes + taskDuration > maxDailyMinutes || currentMinutes + taskDuration > endLimitMinutes) {
      conflicts.push({
        type: 'overload',
        taskId: task.id,
        message: `Task "${task.title}" (${taskDuration}m) exceeds available working hours for today (ends at ${preferences.workEndTime}).`,
        suggestedMitigation: 'Move to tomorrow or split into smaller 20m subtasks.',
      });
      unscheduledTasks.push(task);
      continue;
    }

    // Split long tasks into chunks matching focus duration if desired
    let taskRemaining = taskDuration;
    const maxChunk = Math.max(25, preferences.focusDurationMinutes || 45);

    while (taskRemaining > 0) {
      const chunk = Math.min(taskRemaining, maxChunk);
      const chunkEnd = currentMinutes + chunk;

      if (chunkEnd > endLimitMinutes) {
        conflicts.push({
          type: 'outside_hours',
          taskId: task.id,
          message: `Chunk of "${task.title}" could not fit before end of day (${preferences.workEndTime}).`,
          suggestedMitigation: 'Shorten earlier tasks or extend working window.',
        });
        unscheduledTasks.push(task);
        break;
      }

      // Add Focus Block
      const blockId = `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      generatedBlocks.push({
        id: blockId,
        taskId: task.id,
        title: task.title,
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(chunkEnd),
        type: 'focus',
        status: 'planned',
        date: targetDate,
        priority: task.priority,
      });

      currentMinutes = chunkEnd;
      totalScheduledTaskMinutes += chunk;
      taskRemaining -= chunk;
      sessionIndex++;

      // Insert Break if remaining work exists and day isn't over
      if (taskRemaining > 0 || currentMinutes < endLimitMinutes - 20) {
        const isLongBreak = sessionIndex % (preferences.sessionsBeforeLongBreak || 3) === 0;
        const breakDuration = isLongBreak
          ? (preferences.longBreakMinutes || 20)
          : (preferences.shortBreakMinutes || 10);

        if (currentMinutes + breakDuration <= endLimitMinutes) {
          generatedBlocks.push({
            id: `break_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: isLongBreak ? '☕ Deep Refresh Break' : '⚡ Micro Break',
            startTime: minutesToTime(currentMinutes),
            endTime: minutesToTime(currentMinutes + breakDuration),
            type: 'break',
            status: 'planned',
            date: targetDate,
          });
          currentMinutes += breakDuration;
        }
      }
    }

    scheduledTaskIds.add(task.id);
  }

  // Sort all blocks chronologically
  generatedBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const totalHours = (totalScheduledTaskMinutes / 60).toFixed(1);
  const summary = `Scheduled ${generatedBlocks.filter((b) => b.type === 'focus').length} focus blocks (${totalHours}h focused work) within ${preferences.workStartTime} - ${preferences.workEndTime}.`;

  return {
    blocks: generatedBlocks,
    conflicts,
    scheduledMinutes: totalScheduledTaskMinutes,
    remainingUnscheduledTasks: unscheduledTasks,
    summary,
  };
}

/**
 * Adaptive rescheduling when tasks run late, get delayed, or are marked blocked
 */
export function adaptSchedule(
  currentBlocks: ScheduleBlock[],
  tasks: Task[],
  preferences: UserPreferences,
  currentTimeStr: string = minutesToTime(new Date().getHours() * 60 + new Date().getMinutes())
): { updatedBlocks: ScheduleBlock[]; diff: RescheduleDiff } {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMinutes = timeToMinutes(currentTimeStr);

  // Completed blocks are strictly preserved
  const preservedBlocks = currentBlocks.filter(
    (b) => b.status === 'completed' || timeToMinutes(b.endTime) <= currentMinutes
  );

  // Incomplete tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  // Recalculate schedule starting from current time
  const updatedPreferences: UserPreferences = {
    ...preferences,
    workStartTime: currentTimeStr,
  };

  const scheduleResult = generateDailySchedule(
    pendingTasks,
    updatedPreferences,
    todayStr,
    preservedBlocks
  );

  const movedCount = scheduleResult.blocks.filter((b) => b.status === 'planned').length;
  const delayedTaskTitles = tasks.filter((t) => t.status === 'delayed').map((t) => t.title);

  const diff: RescheduleDiff = {
    timestamp: new Date().toISOString(),
    reason: delayedTaskTitles.length > 0
      ? `Rebalanced after delay in: ${delayedTaskTitles.join(', ')}`
      : `Real-time flow adjustment starting at ${currentTimeStr}`,
    movedBlocksCount: movedCount,
    extendedTasks: delayedTaskTitles,
    deferredTasks: scheduleResult.remainingUnscheduledTasks.map((t) => t.title),
    summary: `Shifted remaining ${movedCount} time blocks forward from ${currentTimeStr}. Preserved all ${preservedBlocks.length} completed items. ${scheduleResult.conflicts.length > 0 ? scheduleResult.conflicts[0].message : 'All remaining tasks fit within working limits.'}`,
  };

  return {
    updatedBlocks: scheduleResult.blocks,
    diff,
  };
}
