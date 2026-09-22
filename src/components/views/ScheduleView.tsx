import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Coffee,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';
import { Task, ScheduleBlock, UserPreferences, ScheduleConflict } from '../../types';
import { timeToMinutes } from '../../utils/scheduler';

interface ScheduleViewProps {
  schedule: ScheduleBlock[];
  tasks: Task[];
  preferences: UserPreferences;
  conflicts: ScheduleConflict[];
  onGenerateSchedule: () => void;
  onAdaptPlan: () => void;
  onStartFocusOnTask: (task: Task) => void;
  onUpdateBlockStatus: (blockId: string, status: ScheduleBlock['status']) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  tasks,
  preferences,
  conflicts,
  onGenerateSchedule,
  onAdaptPlan,
  onStartFocusOnTask,
  onUpdateBlockStatus,
}) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find active block
  const activeBlock = schedule.find((b) => {
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    return currentMinutes >= start && currentMinutes <= end;
  });

  const totalFocusBlocks = schedule.filter((b) => b.type === 'focus');
  const completedFocusBlocks = totalFocusBlocks.filter((b) => b.status === 'completed');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Constraint-Aware Scheduling</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Optimized Daily Schedule</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {preferences.workStartTime} – {preferences.workEndTime}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-overlapping time-blocks respecting {preferences.focusDurationMinutes}m focus bursts, {preferences.shortBreakMinutes}m breaks, and dependency chains.
          </p>
        </div>

        {/* Schedule Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="adapt-schedule-main-btn"
            onClick={onAdaptPlan}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Adapt My Plan</span>
          </button>

          <button
            id="regenerate-schedule-btn"
            onClick={onGenerateSchedule}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recalculate Schedule</span>
          </button>
        </div>
      </div>

      {/* Conflicts & Constraint Violations Alert */}
      {conflicts.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Schedule Bottleneck & Overload Warnings ({conflicts.length})</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/20">
                <div>
                  <p className="font-semibold text-amber-200">{c.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">💡 Suggestion: {c.suggestedMitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-white">Daily Execution Flow</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {completedFocusBlocks.length}/{totalFocusBlocks.length} Focus Blocks Crushed
          </span>
        </div>

        {schedule.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Clock className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No time blocks scheduled yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Recalculate Schedule" to automatically construct an optimized plan from your active tasks.
            </p>
            <button
              onClick={onGenerateSchedule}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30"
            >
              Generate Optimized Day
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {schedule.map((block) => {
              const isFocus = block.type === 'focus';
              const isCompleted = block.status === 'completed';
              const isCurrent = activeBlock?.id === block.id;
              const associatedTask = tasks.find((t) => t.id === block.taskId);

              return (
                <div key={block.id} className="relative group">
                  {/* Timeline node icon */}
                  <div
                    className={`absolute -left-[27px] top-3.5 w-4 h-4 rounded-full border-2 transition-all ${
                      isCurrent
                        ? 'bg-cyan-400 border-white ring-4 ring-cyan-500/30 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-300'
                        : isFocus
                        ? 'bg-slate-900 border-violet-500'
                        : 'bg-slate-900 border-indigo-400'
                    }`}
                  />

                  {/* Block Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-cyan-950/40 border-violet-500 shadow-xl shadow-violet-500/20'
                        : isCompleted
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : isFocus
                        ? 'bg-slate-900/80 border-slate-800 hover:border-violet-500/40'
                        : 'bg-indigo-950/20 border-indigo-900/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCurrent ? 'text-cyan-300' : 'text-slate-400'
                            }`}
                          >
                            {block.startTime} – {block.endTime}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isFocus
                                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {isFocus ? 'Focus Block' : 'Recovery Break'}
                          </span>

                          {isCurrent && (
                            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                              LIVE NOW
                            </span>
                          )}

                          {block.priority && (
                            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              {block.priority}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-bold ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {block.title}
                        </h4>

                        {associatedTask?.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{associatedTask.description}</p>
                        )}
                      </div>

                      {/* Right Block Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isFocus && associatedTask && block.status !== 'completed' && (
                          <button
                            onClick={() => onStartFocusOnTask(associatedTask)}
                            className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Launch Focus</span>
                          </button>
                        )}

                        {block.status === 'completed' ? (
                          <button
                            onClick={() => onUpdateBlockStatus(block.id, 'planned')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateBlockStatus(block.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
