import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, Priority, GeneratedPlan, Goal } from '../../types';
import { AIClient } from '../../services/aiClient';

interface PlannerViewProps {
  initialPrompt?: string;
  onAcceptPlan: (goal: Goal, tasks: Task[]) => void;
  onNavigateToSchedule: () => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  initialPrompt = '',
  onAcceptPlan,
  onNavigateToSchedule: _onNavigateToSchedule,
}) => {
  const [goalText, setGoalText] = useState(initialPrompt);
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [targetDays, setTargetDays] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  const samplePresets = [
    {
      title: 'AI Exam Prep in 3 Days',
      text: 'I need to prepare for my AI exam in 3 days. I have 5 modules to study and can spend 2 hours each day.',
      hours: 2,
      days: 3,
    },
    {
      title: 'Launch SaaS MVP in 48h',
      text: 'Build and deploy a full-stack SaaS MVP for a productivity tool with landing page, authentication, and core workflow in 48 hours.',
      hours: 6,
      days: 2,
    },
    {
      title: 'Publish Technical Research Paper',
      text: 'Complete literature review, benchmarking experiments, graph visualizations, and LaTeX manuscript for publication submission.',
      hours: 4,
      days: 5,
    },
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goalText.trim()) return;

    setLoading(true);
    setAcceptedSuccess(false);

    try {
      const plan = await AIClient.generatePlan(goalText, dailyHours, targetDays);
      setGeneratedPlan(plan);
      // Expand first 2 tasks by default
      setExpandedTasks({ 0: true, 1: true });
    } catch (err) {
      console.error('Plan generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    if (!generatedPlan) return;
    const updatedTasks = [...generatedPlan.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setGeneratedPlan({ ...generatedPlan, tasks: updatedTasks });
  };

  const handleSubtaskChange = (taskIndex: number, subtaskIndex: number, newTitle: string) => {
    if (!generatedPlan) return;
    const updatedTasks = [...generatedPlan.tasks];
    const subtasks = [...updatedTasks[taskIndex].subtasks];
    subtasks[subtaskIndex] = { ...subtasks[subtaskIndex], title: newTitle };
    updatedTasks[taskIndex].subtasks = subtasks;
    setGeneratedPlan({ ...generatedPlan, tasks: updatedTasks });
  };

  const handleAddSubtask = (taskIndex: number) => {
    if (!generatedPlan) return;
    const updatedTasks = [...generatedPlan.tasks];
    const subtasks = [...updatedTasks[taskIndex].subtasks, { title: 'New actionable step', estimatedMinutes: 15 }];
    updatedTasks[taskIndex].subtasks = subtasks;
    setGeneratedPlan({ ...generatedPlan, tasks: updatedTasks });
  };

  const handleDeleteSubtask = (taskIndex: number, subtaskIndex: number) => {
    if (!generatedPlan) return;
    const updatedTasks = [...generatedPlan.tasks];
    const subtasks = updatedTasks[taskIndex].subtasks.filter((_, idx) => idx !== subtaskIndex);
    updatedTasks[taskIndex].subtasks = subtasks;
    setGeneratedPlan({ ...generatedPlan, tasks: updatedTasks });
  };

  const handleAddTask = () => {
    if (!generatedPlan) return;
    const newTask = {
      title: 'New Custom Task',
      description: 'Define your implementation details here',
      priority: 'medium' as Priority,
      estimatedMinutes: 30,
      subtasks: [{ title: 'Initial setup', estimatedMinutes: 15 }],
      recommendedReason: 'Custom added task',
    };
    setGeneratedPlan({
      ...generatedPlan,
      tasks: [...generatedPlan.tasks, newTask],
    });
    setExpandedTasks({ ...expandedTasks, [generatedPlan.tasks.length]: true });
  };

  const handleDeleteTask = (index: number) => {
    if (!generatedPlan) return;
    const updated = generatedPlan.tasks.filter((_, i) => i !== index);
    setGeneratedPlan({ ...generatedPlan, tasks: updated });
  };

  const toggleExpand = (index: number) => {
    setExpandedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAcceptPlan = () => {
    if (!generatedPlan) return;

    const goalId = `goal_${Date.now()}`;
    const newGoal: Goal = {
      id: goalId,
      title: generatedPlan.goalTitle,
      description: generatedPlan.goalDescription,
      category: generatedPlan.category || 'General',
      deadline: new Date(Date.now() + (generatedPlan.suggestedDays || 3) * 86400000)
        .toISOString()
        .split('T')[0],
      targetHours: Math.round(generatedPlan.totalEstimatedMinutes / 60) || 6,
      status: 'active',
      createdAt: new Date().toISOString(),
      aiGenerated: true,
      isSample: false,
    };

    const newTasks: Task[] = generatedPlan.tasks.map((t, idx) => {
      const taskId = `task_${Date.now()}_${idx}`;
      return {
        id: taskId,
        goalId: goalId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        estimatedMinutes: Number(t.estimatedMinutes) || 30,
        actualMinutes: 0,
        status: 'todo',
        dependencies: t.dependencies || [],
        executionOrder: idx + 1,
        recommendedReason: t.recommendedReason,
        createdAt: new Date().toISOString(),
        subtasks: t.subtasks.map((st, sidx) => ({
          id: `st_${Date.now()}_${idx}_${sidx}`,
          taskId: taskId,
          title: st.title,
          completed: false,
          estimatedMinutes: st.estimatedMinutes || 15,
        })),
        isSample: false,
      };
    });

    onAcceptPlan(newGoal, newTasks);
    setAcceptedSuccess(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-cyan-950/30">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Autonomous AI Goal Deconstruction</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Turn Natural Language Goals into Executable Plans
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Enter any high-level objective. FlowPilot's AI engine analyzes milestones, computes optimal subtasks, assigns urgency-weighted priorities, and creates a ready-to-schedule execution blueprint.
        </p>
      </div>

      {/* Goal Input & Config Box */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Describe your objective in natural language:
            </label>
            <textarea
              id="ai-goal-textarea"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={3}
              placeholder="e.g. I need to prepare for my AI exam in 3 days. I have 5 modules to study and can spend 2 hours each day..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-100 placeholder-slate-500 text-sm transition-all outline-none resize-none"
            />
          </div>

          {/* Time & Capacity Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Daily Available Time</span>
              </label>
              <select
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-violet-500 outline-none"
              >
                <option value={1}>1 hour / day (Micro-sprint)</option>
                <option value={2}>2 hours / day (Moderate)</option>
                <option value={4}>4 hours / day (Standard Work)</option>
                <option value={6}>6 hours / day (Intensive Focus)</option>
                <option value={8}>8 hours / day (Full Hackathon Mode)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span>Target Timeframe</span>
              </label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-violet-500 outline-none"
              >
                <option value={1}>1 Day (Immediate Delivery)</option>
                <option value={2}>2 Days (Weekend / Hackathon)</option>
                <option value={3}>3 Days (Standard Sprint)</option>
                <option value={5}>5 Days (Work Week)</option>
                <option value={7}>7 Days (1 Week Goal)</option>
              </select>
            </div>
          </div>

          {/* Presets */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Or click an example prompt:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setGoalText(preset.text);
                    setDailyHours(preset.hours);
                    setTargetDays(preset.days);
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-violet-500/40 text-left transition-all group"
                >
                  <p className="text-xs font-bold text-violet-300 group-hover:text-violet-200 truncate">
                    {preset.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !goalText.trim()}
              id="ai-planner-generate-btn"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Plan with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Deconstruct Goal with FlowPilot AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Plan Output Canvas */}
      {generatedPlan && (
        <div className="space-y-6 animate-fadeIn">
          {/* Plan Header Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {generatedPlan.category}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      generatedPlan.isDemo
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {generatedPlan.isDemo ? '⚡ High-Fidelity Heuristic Demo Plan' : '✨ Live Gemini Generated Plan'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{generatedPlan.goalTitle}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">{generatedPlan.goalDescription}</p>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total Estimated Work</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {Math.round(generatedPlan.totalEstimatedMinutes / 60)}h {generatedPlan.totalEstimatedMinutes % 60}m
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Regenerate plan"
                >
                  <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* AI Strategic Insight Note */}
            {generatedPlan.aiProductivityInsight && (
              <div className="mt-4 p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-violet-200 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>{generatedPlan.aiProductivityInsight}</span>
              </div>
            )}
          </div>

          {/* Editable Task List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Decomposed Action Steps ({generatedPlan.tasks.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddTask}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Task</span>
              </button>
            </div>

            {generatedPlan.tasks.map((task, idx) => {
              const isExpanded = !!expandedTasks[idx];

              return (
                <div
                  key={idx}
                  className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-violet-500/40 transition-all space-y-3"
                >
                  {/* Task Summary Line */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-100 focus:bg-slate-900/80 px-2 py-1 rounded border border-transparent focus:border-slate-700 outline-none w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Priority selector */}
                      <select
                        value={task.priority}
                        onChange={(e) => handleTaskChange(idx, 'priority', e.target.value as Priority)}
                        className="text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 outline-none"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Duration */}
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700 text-xs text-slate-300">
                        <input
                          type="number"
                          value={task.estimatedMinutes}
                          onChange={(e) => handleTaskChange(idx, 'estimatedMinutes', Number(e.target.value))}
                          className="w-10 bg-transparent text-right outline-none font-mono"
                        />
                        <span className="text-[10px] text-slate-400">m</span>
                      </div>

                      {/* Expand / Collapse */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details & Subtasks */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Description:</label>
                        <textarea
                          value={task.description}
                          onChange={(e) => handleTaskChange(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs outline-none focus:border-slate-700"
                        />
                      </div>

                      {/* Subtasks */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">Actionable Subtasks:</span>
                          <button
                            type="button"
                            onClick={() => handleAddSubtask(idx)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Subtask
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {task.subtasks.map((subtask, sidx) => (
                            <div key={sidx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                              <input
                                type="text"
                                value={subtask.title}
                                onChange={(e) => handleSubtaskChange(idx, sidx, e.target.value)}
                                className="flex-1 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 text-slate-200 text-xs outline-none focus:border-slate-700"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtask(idx, sidx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Acceptance & Final Action Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/60 to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Ready to execute this plan?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Accepting will import all tasks into your workspace and automatically build an optimized daily schedule.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {acceptedSuccess ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-4 py-2.5 rounded-xl border border-emerald-500/40">
                  <Check className="w-4 h-4" />
                  <span>Plan Successfully Synced!</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="accept-plan-btn"
                  onClick={handleAcceptPlan}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Plan & Optimize Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
