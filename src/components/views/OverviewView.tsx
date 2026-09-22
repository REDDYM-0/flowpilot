import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  Target,
  ListTodo,
} from 'lucide-react';
import { Task, ScheduleBlock, UserPreferences } from '../../types';
import { prioritizeTasks, getScoreBadge } from '../../utils/prioritization';
import { timeToMinutes } from '../../utils/scheduler';

interface OverviewViewProps {
  tasks: Task[];
  schedule: ScheduleBlock[];
  preferences: UserPreferences;
  focusMinutesToday: number;
  onNavigateToPlanner: (initialPrompt?: string) => void;
  onNavigateToTasks: () => void;
  onNavigateToSchedule: () => void;
  onStartFocusOnTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAdaptPlan: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tasks,
  schedule,
  preferences,
  focusMinutesToday,
  onNavigateToPlanner,
  onNavigateToTasks,
  onNavigateToSchedule,
  onStartFocusOnTask,
  onToggleTaskComplete,
  onAdaptPlan,
}) => {
  const [quickGoalInput, setQuickGoalInput] = useState('');

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const prioritized = prioritizeTasks(tasks);
  const topPriorities = prioritized.filter((t) => t.status !== 'completed').slice(0, 4);
  const nextBestTask = topPriorities[0];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find active schedule block
  const activeBlock = schedule.find((b) => {
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    return currentMinutes >= start && currentMinutes <= end;
  });

  const examplePrompts = [
    'Prepare for my AI Systems exam in 3 days with 5 modules',
    'Build and launch SaaS MVP full-stack in 48 hours',
    'Write and submit 10-page research paper with literature review',
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickGoalInput.trim()) {
      onNavigateToPlanner(quickGoalInput.trim());
    }
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* A. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-slate-900/40 p-6 rounded-2xl border border-violet-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Command Center Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, <span className="gradient-text-violet">{preferences.userName || 'Commander'}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            FlowPilot has optimized your path today. You have{' '}
            <span className="text-cyan-300 font-semibold">{pendingTasks.length} pending tasks</span> and{' '}
            <span className="text-emerald-300 font-semibold">{completedTasks.length} completed</span> milestones.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {nextBestTask && (
            <button
              onClick={() => onStartFocusOnTask(nextBestTask)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Next Focus ({nextBestTask.estimatedMinutes}m)</span>
            </button>
          )}
        </div>
      </div>

      {/* B. AI Goal Input Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/15 transition-all" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Instant AI Goal Decomposition</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-3">
            What do you want to accomplish next?
          </h3>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickGoalInput}
                onChange={(e) => setQuickGoalInput(e.target.value)}
                placeholder="E.g., I need to prepare for my AI exam in 3 days. I have 5 modules and can spend 2h each day..."
                className="w-full px-4 py-3.5 pr-44 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-100 placeholder-slate-500 text-sm transition-all shadow-inner outline-none"
              />
              <button
                type="submit"
                id="generate-plan-submit-btn"
                className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate My Plan</span>
              </button>
            </div>

            {/* Example Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Try templates:</span>
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigateToPlanner(prompt)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left truncate max-w-xs"
                >
                  "{prompt.slice(0, 38)}..."
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* C. Today's Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Tasks */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Tasks Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedTasks.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{totalTasks} total tasks logged</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Card 2: Tasks Remaining */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Tasks Remaining</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{pendingTasks.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ~{pendingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0)}m estimated effort
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Card 3: Focus Minutes */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Focus Minutes Today</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{focusMinutesToday} <span className="text-xs text-slate-400 font-normal">mins</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target: {preferences.dailyWorkloadLimitHours * 60}m limit
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Card 4: Daily Completion Percentage */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Daily Execution Velocity</p>
            <p className="text-2xl font-bold text-violet-400 mt-1">{completionPercentage}%</p>
            {/* Mini progress bar */}
            <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
        </div>
      </div>

      {/* D. Priority Tasks & E. Today's Schedule (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Priority Tasks (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Smart Priority Tasks</span>
                  <span className="text-[11px] font-mono text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                    Ranked by Urgency & Impact
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Calculated by transparent multi-factor scoring engine</p>
              </div>
              <button
                onClick={onNavigateToTasks}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>View All ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topPriorities.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">All planned tasks completed!</p>
                <p className="text-xs">Generate a new plan or add tasks to keep your streak alive.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPriorities.map((task) => {
                  const badge = getScoreBadge(task.priorityScore || 50);
                  const isBlocked = task.dependencies && task.dependencies.some(
                    (d) => tasks.find((t) => t.id === d)?.status !== 'completed'
                  );

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                            title="Mark completed"
                          >
                            <div className="w-5 h-5 rounded-md border border-slate-700 hover:border-emerald-400 flex items-center justify-center group-hover:border-slate-500" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-100 group-hover:text-violet-200 transition-colors">
                                {task.title}
                              </h4>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.color}`}
                              >
                                {task.priority} ({task.priorityScore ?? 50} pts)
                              </span>
                              {isBlocked && (
                                <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Blocked
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>

                            {/* Transparent Reason & Subtask Count */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {task.estimatedMinutes}m est.
                              </span>
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span className="text-slate-500">
                                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                                </span>
                              )}
                              {task.recommendedReason && (
                                <span className="text-violet-300/80 italic truncate max-w-xs">
                                  💡 {task.recommendedReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Start Focus Button */}
                        <button
                          onClick={() => onStartFocusOnTask(task)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Focus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Prioritization automatically updates when tasks are marked complete.</span>
            <button
              onClick={onAdaptPlan}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Recalculate Priorities ➜
            </button>
          </div>
        </div>

        {/* Right: Today's Schedule Timeline & Active Block (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Today's Schedule</span>
                  {activeBlock && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                      NOW ACTIVE
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {preferences.workStartTime} - {preferences.workEndTime} Timeline
                </p>
              </div>
              <button
                onClick={onNavigateToSchedule}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {schedule.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No schedule blocks generated</p>
                <p className="text-xs">Click "Generate Schedule" to optimize your day.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {schedule.slice(0, 6).map((block) => {
                  const isFocus = block.type === 'focus';
                  const isCompleted = block.status === 'completed';
                  const isCurrent = activeBlock?.id === block.id;

                  return (
                    <div
                      key={block.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/15'
                          : isCompleted
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : isFocus
                          ? 'bg-slate-900/70 border-slate-800'
                          : 'bg-indigo-950/20 border-indigo-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              isCurrent ? 'text-cyan-300' : 'text-slate-400'
                            }`}
                          >
                            {block.startTime} - {block.endTime}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              isFocus
                                ? 'bg-violet-500/20 text-violet-300'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {isFocus ? 'Focus Block' : 'Break'}
                          </span>
                        </div>
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold mt-1 truncate ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {block.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Need to adapt for delays or meetings?</span>
            <button
              onClick={onAdaptPlan}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>Adapt Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* F. AI Productivity Insight Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/30 via-slate-900/50 to-indigo-950/30 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5 text-violet-300 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">FlowPilot Contextual Productivity Insight</h4>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-700/40">
              Live AI Analysis
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {nextBestTask
              ? `Your highest impact leverage point right now is "${nextBestTask.title}". Finishing this unblocks dependent workflows. You have ${focusMinutesToday}m of deep focus logged today; maintain your focus rhythm for maximum retention.`
              : 'You have completed all scheduled tasks! Great momentum. Plan your next milestone or review analytics to evaluate your focus distribution.'}
          </p>
        </div>
      </div>
    </div>
  );
};
