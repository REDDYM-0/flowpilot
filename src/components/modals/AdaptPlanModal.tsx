import React, { useState } from 'react';
import {
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, ScheduleBlock, UserPreferences, RescheduleDiff } from '../../types';
import { adaptSchedule, minutesToTime } from '../../utils/scheduler';

interface AdaptPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  schedule: ScheduleBlock[];
  preferences: UserPreferences;
  onApplyAdaptedSchedule: (newBlocks: ScheduleBlock[]) => void;
}

export const AdaptPlanModal: React.FC<AdaptPlanModalProps> = ({
  isOpen,
  onClose,
  tasks,
  schedule,
  preferences,
  onApplyAdaptedSchedule,
}) => {
  const [delayReason, setDelayReason] = useState('Task ran overtime / unexpected interruptions');
  const [adaptedResult, setAdaptedResult] = useState<{
    updatedBlocks: ScheduleBlock[];
    diff: RescheduleDiff;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const currentTimeStr = minutesToTime(now.getHours() * 60 + now.getMinutes());

  const handleRunAdaptation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = adaptSchedule(schedule, tasks, preferences, currentTimeStr);
      setAdaptedResult(result);
      setIsCalculating(false);
    }, 400);
  };

  const handleConfirm = () => {
    if (!adaptedResult) return;
    onApplyAdaptedSchedule(adaptedResult.updatedBlocks);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-violet-500/40 max-w-xl w-full space-y-6 animate-scaleUp shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Adaptive Real-Time Rescheduler</h3>
              <p className="text-xs text-slate-400">
                Rebalances your day from current time (<span className="text-cyan-300 font-mono">{currentTimeStr}</span>) without losing completed progress.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Trigger */}
        {!adaptedResult ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                What caused the schedule drift or delay?
              </label>
              <select
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value="Task ran overtime / unexpected interruptions">
                  Task ran overtime / unexpected interruptions
                </option>
                <option value="Started workday later than planned">
                  Started workday later than planned
                </option>
                <option value="Emergency meeting or blocker occurred">
                  Emergency meeting or blocker occurred
                </option>
                <option value="Low energy — need lighter focus sessions">
                  Low energy — need lighter focus sessions
                </option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-violet-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>What FlowPilot will do:</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-400">
                <li>Preserve all completed tasks and historical focus records.</li>
                <li>Recalculate start times for all remaining pending tasks from <span className="text-cyan-300 font-mono">{currentTimeStr}</span>.</li>
                <li>Respect priority weights and insert micro-breaks for cognitive recovery.</li>
              </ul>
            </div>

            <button
              onClick={handleRunAdaptation}
              disabled={isCalculating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>{isCalculating ? 'Calculating Optimal Rebalance...' : 'Compute Adapted Schedule'}</span>
            </button>
          </div>
        ) : (
          /* Adaptation Diff & Summary */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Adaptation Strategy Generated</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{adaptedResult.diff.summary}</p>
            </div>

            {/* Diff metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-slate-400">Rebalanced Blocks</p>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">
                  {adaptedResult.diff.movedBlocksCount} slots
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-slate-400">Deferred to Protect Limits</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {adaptedResult.diff.deferredTasks.length} tasks
                </p>
              </div>
            </div>

            {adaptedResult.diff.deferredTasks.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Deferred: {adaptedResult.diff.deferredTasks.join(', ')} (Exceeded daily {preferences.workEndTime} limit).
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setAdaptedResult(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Apply New Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
