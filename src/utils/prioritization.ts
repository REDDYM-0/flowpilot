import { Task, Priority } from '../types';

export interface ScoredTask extends Task {
  priorityScore: number;
  scoreBreakdown: {
    urgency: number;      // 0-35
    importance: number;   // 0-30
    effortFeasibility: number; // 0-15
    dependencyReadiness: number; // 0-20
  };
  recommendedReason: string;
}

/**
 * Calculates a multi-factor priority score (0 - 100)
 */
export function calculatePriorityScore(
  task: Task,
  allTasks: Task[],
  todayStr: string = new Date().toISOString().split('T')[0]
): ScoredTask {
  // 1. Urgency from deadline (0 - 35 pts)
  let urgency = 15; // default neutral
  let deadlineNote = 'Flexible deadline';
  if (task.deadline) {
    const today = new Date(todayStr);
    const deadline = new Date(task.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      urgency = 35; // Overdue
      deadlineNote = 'Overdue by ' + Math.abs(diffDays) + 'd';
    } else if (diffDays === 0) {
      urgency = 34; // Due today
      deadlineNote = 'Due today!';
    } else if (diffDays === 1) {
      urgency = 28; // Due tomorrow
      deadlineNote = 'Due tomorrow';
    } else if (diffDays <= 3) {
      urgency = 22; // Due within 3 days
      deadlineNote = `Due in ${diffDays} days`;
    } else if (diffDays <= 7) {
      urgency = 15;
      deadlineNote = `Due in ${diffDays} days`;
    } else {
      urgency = 8;
      deadlineNote = `Due in ${diffDays} days`;
    }
  }

  // 2. Importance score (0 - 30 pts)
  const importanceWeights: Record<Priority, number> = {
    critical: 30,
    high: 22,
    medium: 14,
    low: 6,
  };
  const importance = importanceWeights[task.priority] || 14;

  // 3. Dependency readiness (0 - 20 pts)
  let dependencyReadiness = 20;
  let blockedByCount = 0;
  if (task.dependencies && task.dependencies.length > 0) {
    const incompleteDeps = allTasks.filter(
      (t) => task.dependencies.includes(t.id) && t.status !== 'completed'
    );
    blockedByCount = incompleteDeps.length;
    if (blockedByCount > 0) {
      // Heavily penalized if blocked by unfinished tasks
      dependencyReadiness = 0;
    } else {
      dependencyReadiness = 20;
    }
  }

  // 4. Effort & quick win bonus (0 - 15 pts)
  // Tasks with manageable duration (15m - 60m) get an initial momentum bonus
  let effortFeasibility = 10;
  if (task.estimatedMinutes <= 30) {
    effortFeasibility = 15; // Quick win bonus
  } else if (task.estimatedMinutes <= 60) {
    effortFeasibility = 12;
  } else if (task.estimatedMinutes <= 120) {
    effortFeasibility = 8;
  } else {
    effortFeasibility = 5; // Long tasks need breaking down
  }

  // Completed or blocked tasks adjustments
  if (task.status === 'completed') {
    return {
      ...task,
      priorityScore: 0,
      scoreBreakdown: { urgency: 0, importance: 0, effortFeasibility: 0, dependencyReadiness: 0 },
      recommendedReason: 'Task is completed.',
    };
  }

  let totalScore = urgency + importance + effortFeasibility + dependencyReadiness;

  // Status adjustments
  if (task.status === 'in-progress') {
    totalScore += 10; // Continue momentum on active tasks
  } else if (task.status === 'delayed') {
    totalScore += 8; // Recover delayed tasks
  } else if (task.status === 'blocked' || blockedByCount > 0) {
    totalScore = Math.max(5, totalScore - 40);
  }

  totalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // Generate transparent natural language reasoning
  let reason = '';
  if (blockedByCount > 0) {
    reason = `Blocked by ${blockedByCount} prerequisite task(s). Finish dependencies first.`;
  } else if (task.status === 'in-progress') {
    reason = `In progress. Keep your current momentum going to finish.`;
  } else if (urgency >= 28) {
    reason = `High deadline pressure (${deadlineNote}) + ${task.priority.toUpperCase()} priority tier.`;
  } else if (importance >= 25) {
    reason = `Critical path item essential for major milestone delivery.`;
  } else if (task.estimatedMinutes <= 30 && importance >= 14) {
    reason = `Quick high-impact win (${task.estimatedMinutes}m) with zero blocking dependencies.`;
  } else {
    reason = `Ranked for optimal flow balance (${task.estimatedMinutes}m duration, ${deadlineNote}).`;
  }

  return {
    ...task,
    priorityScore: totalScore,
    scoreBreakdown: {
      urgency,
      importance,
      effortFeasibility,
      dependencyReadiness,
    },
    recommendedReason: task.recommendedReason || reason,
  };
}

/**
 * Sorts all tasks by priority score descending
 */
export function prioritizeTasks(tasks: Task[]): ScoredTask[] {
  const scored = tasks.map((t) => calculatePriorityScore(t, tasks));
  return scored.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Categorize priority level dynamically based on score
 */
export function getScoreBadge(score: number): { label: Priority; color: string; bg: string } {
  if (score >= 80) return { label: 'critical', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
  if (score >= 60) return { label: 'high', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
  if (score >= 35) return { label: 'medium', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' };
  return { label: 'low', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' };
}
