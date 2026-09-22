import {
  Goal,
  Task,
  ScheduleBlock,
  FocusSession,
  UserPreferences,
  ChatMessage,
} from '../types';
import {
  DEFAULT_PREFERENCES,
  SAMPLE_GOALS,
  SAMPLE_TASKS,
  SAMPLE_SCHEDULE_BLOCKS,
  SAMPLE_FOCUS_SESSIONS,
} from './sampleData';

const KEYS = {
  PREFERENCES: 'flowpilot_preferences_v1',
  GOALS: 'flowpilot_goals_v1',
  TASKS: 'flowpilot_tasks_v1',
  SCHEDULE: 'flowpilot_schedule_v1',
  FOCUS_SESSIONS: 'flowpilot_focus_sessions_v1',
  CHAT_MESSAGES: 'flowpilot_chat_messages_v1',
  INITIALIZED: 'flowpilot_initialized_v1',
};

// Dispatch a custom event so React hooks can re-render immediately
function notifyChange(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowpilot-data-change', { detail: { key } }));
  }
}

export class StorageService {
  // --- Initialization ---
  public static init() {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(KEYS.INITIALIZED);
    if (!initialized) {
      this.resetToSampleData();
    }
  }

  public static resetToSampleData() {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
    localStorage.setItem(KEYS.GOALS, JSON.stringify(SAMPLE_GOALS));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(SAMPLE_TASKS));
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(SAMPLE_SCHEDULE_BLOCKS));
    localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(SAMPLE_FOCUS_SESSIONS));
    localStorage.setItem(
      KEYS.CHAT_MESSAGES,
      JSON.stringify([
        {
          id: 'welcome_1',
          role: 'assistant',
          content:
            "👋 Welcome to **FlowPilot**! I am your AI Productivity Execution Agent.\n\nI can help break down complex goals, prioritize tasks, optimize your daily schedule, and adapt your plan when roadblocks occur. Try entering a goal in the **AI Planner** or ask me: *'What should I work on next?'*",
          timestamp: new Date().toISOString(),
        },
      ])
    );
    localStorage.setItem(KEYS.INITIALIZED, 'true');
    notifyChange('*');
  }

  public static clearAllData() {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
    localStorage.setItem(KEYS.GOALS, JSON.stringify([]));
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify([]));
    localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify([]));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
    notifyChange('*');
  }

  // --- Preferences ---
  public static getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  public static savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
    notifyChange(KEYS.PREFERENCES);
    return updated;
  }

  // --- Goals ---
  public static getGoals(): Goal[] {
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveGoal(goal: Goal): Goal {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.unshift(goal);
    }
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    notifyChange(KEYS.GOALS);
    return goal;
  }

  public static deleteGoal(goalId: string) {
    const goals = this.getGoals().filter((g) => g.id !== goalId);
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    // Also delete or unlink associated tasks
    const tasks = this.getTasks().map((t) => (t.goalId === goalId ? { ...t, goalId: undefined } : t));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    notifyChange(KEYS.GOALS);
    notifyChange(KEYS.TASKS);
  }

  // --- Tasks ---
  public static getTasks(): Task[] {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveTask(task: Task): Task {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    notifyChange(KEYS.TASKS);
    return task;
  }

  public static saveTasks(newTasks: Task[]) {
    const current = this.getTasks();
    const map = new Map(current.map((t) => [t.id, t]));
    newTasks.forEach((t) => map.set(t.id, t));
    const merged = Array.from(map.values());
    localStorage.setItem(KEYS.TASKS, JSON.stringify(merged));
    notifyChange(KEYS.TASKS);
  }

  public static deleteTask(taskId: string) {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    // Remove from schedule blocks too
    const schedule = this.getScheduleBlocks().filter((b) => b.taskId !== taskId);
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
    notifyChange(KEYS.TASKS);
    notifyChange(KEYS.SCHEDULE);
  }

  public static toggleTaskCompletion(taskId: string): Task | null {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const isNowCompleted = task.status !== 'completed';
    task.status = isNowCompleted ? 'completed' : 'todo';
    task.completedAt = isNowCompleted ? new Date().toISOString() : undefined;

    // Mark subtasks
    if (task.subtasks) {
      task.subtasks = task.subtasks.map((st) => ({ ...st, completed: isNowCompleted }));
    }

    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));

    // Update associated schedule block status
    const schedule = this.getScheduleBlocks();
    schedule.forEach((b) => {
      if (b.taskId === taskId) {
        b.status = isNowCompleted ? 'completed' : 'planned';
      }
    });
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));

    notifyChange(KEYS.TASKS);
    notifyChange(KEYS.SCHEDULE);
    return task;
  }

  public static toggleSubtask(taskId: string, subtaskId: string): Task | null {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return null;

    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      // If all subtasks are done, consider task completed
      const allDone = task.subtasks.length > 0 && task.subtasks.every((st) => st.completed);
      if (allDone && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
      }
    }

    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    notifyChange(KEYS.TASKS);
    return task;
  }

  // --- Schedule Blocks ---
  public static getScheduleBlocks(): ScheduleBlock[] {
    try {
      const data = localStorage.getItem(KEYS.SCHEDULE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveScheduleBlocks(blocks: ScheduleBlock[]) {
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(blocks));
    notifyChange(KEYS.SCHEDULE);
  }

  public static updateScheduleBlock(block: ScheduleBlock) {
    const blocks = this.getScheduleBlocks();
    const idx = blocks.findIndex((b) => b.id === block.id);
    if (idx >= 0) {
      blocks[idx] = block;
    } else {
      blocks.push(block);
    }
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(blocks));
    notifyChange(KEYS.SCHEDULE);
  }

  // --- Focus Sessions ---
  public static getFocusSessions(): FocusSession[] {
    try {
      const data = localStorage.getItem(KEYS.FOCUS_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static logFocusSession(session: FocusSession) {
    const sessions = this.getFocusSessions();
    sessions.unshift(session);
    localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));

    // Also update task actual minutes
    if (session.taskId) {
      const tasks = this.getTasks();
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) {
        task.actualMinutes = (task.actualMinutes || 0) + session.actualMinutes;
        localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
        notifyChange(KEYS.TASKS);
      }
    }

    notifyChange(KEYS.FOCUS_SESSIONS);
  }

  // --- Chat Messages ---
  public static getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addChatMessage(msg: ChatMessage) {
    const messages = this.getChatMessages();
    messages.push(msg);
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    notifyChange(KEYS.CHAT_MESSAGES);
  }

  public static clearChat() {
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify([]));
    notifyChange(KEYS.CHAT_MESSAGES);
  }

  // --- Backup & Export / Import ---
  public static exportAllData(): string {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      preferences: this.getPreferences(),
      goals: this.getGoals(),
      tasks: this.getTasks(),
      schedule: this.getScheduleBlocks(),
      focusSessions: this.getFocusSessions(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public static importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.preferences) localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(parsed.preferences));
      if (parsed.goals) localStorage.setItem(KEYS.GOALS, JSON.stringify(parsed.goals));
      if (parsed.tasks) localStorage.setItem(KEYS.TASKS, JSON.stringify(parsed.tasks));
      if (parsed.schedule) localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(parsed.schedule));
      if (parsed.focusSessions) localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(parsed.focusSessions));
      notifyChange('*');
      return true;
    } catch {
      return false;
    }
  }
}
