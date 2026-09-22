export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'delayed' | 'blocked';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type BlockType = 'focus' | 'break' | 'buffer';
export type BlockStatus = 'planned' | 'in-progress' | 'completed' | 'skipped';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface Task {
  id: string;
  goalId?: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedMinutes: number;
  actualMinutes: number;
  deadline?: string; // YYYY-MM-DD
  dependencies: string[]; // task IDs that must finish first
  status: TaskStatus;
  subtasks: Subtask[];
  energyLevel?: EnergyLevel;
  executionOrder: number;
  recommendedReason?: string;
  priorityScore?: number;
  createdAt: string;
  completedAt?: string;
  isSample?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string;
  targetHours?: number;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  isSample?: boolean;
  aiGenerated?: boolean;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  title: string;
  startTime: string; // "09:00"
  endTime: string; // "09:50"
  type: BlockType;
  status: BlockStatus;
  date: string; // YYYY-MM-DD
  priority?: Priority;
  actualMinutes?: number;
  isSample?: boolean;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  targetMinutes: number;
  actualMinutes: number;
  startTime: string;
  endTime: string;
  status: 'completed' | 'interrupted';
  notes?: string;
  date: string;
  subtasksCompleted?: number;
}

export interface UserPreferences {
  workStartTime: string; // "09:00"
  workEndTime: string; // "18:00"
  focusDurationMinutes: number; // default 45
  shortBreakMinutes: number; // default 10
  longBreakMinutes: number; // default 20
  sessionsBeforeLongBreak: number; // default 3
  dailyWorkloadLimitHours: number; // default 7
  soundEnabled: boolean;
  ambientSound: 'none' | 'white' | 'rain' | 'binaural' | 'waves';
  theme: 'dark' | 'midnight' | 'cyberpunk';
  autoScheduleOnAccept: boolean;
  userName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    actionType: 'schedule' | 'prioritize' | 'breakdown' | 'focus';
    payload?: any;
  }>;
}

export interface GeneratedPlan {
  goalTitle: string;
  goalDescription: string;
  category: string;
  totalEstimatedMinutes: number;
  suggestedDays: number;
  tasks: Array<{
    title: string;
    description: string;
    priority: Priority;
    estimatedMinutes: number;
    subtasks: Array<{ title: string; estimatedMinutes: number }>;
    dependencies?: string[];
    recommendedReason?: string;
    energyLevel?: EnergyLevel;
  }>;
  aiProductivityInsight: string;
  isDemo?: boolean;
}

export interface ScheduleConflict {
  type: 'overload' | 'deadline_risk' | 'dependency_violation' | 'outside_hours';
  message: string;
  taskId?: string;
  suggestedMitigation: string;
}

export interface RescheduleDiff {
  timestamp: string;
  reason: string;
  movedBlocksCount: number;
  extendedTasks: string[];
  deferredTasks: string[];
  summary: string;
}
