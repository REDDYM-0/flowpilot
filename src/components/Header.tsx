import React from 'react';
import { Play, Sparkles, RefreshCw, Bot, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onStartFocus: () => void;
  onAdaptPlan: () => void;
  onToggleAssistant: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
  totalFocusMinutes: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate: _onNavigate,
  onStartFocus,
  onAdaptPlan,
  onToggleAssistant,
  completedTasksCount,
  totalTasksCount,
  totalFocusMinutes,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Command Overview',
      subtitle: 'Real-time productivity intelligence and daily execution dashboard',
    },
    tasks: {
      title: 'Task Command Center',
      subtitle: 'Multi-factor prioritized task list, subtasks, and dependency graphs',
    },
    planner: {
      title: 'AI Goal Planner',
      subtitle: 'Convert natural language ambitions into structured execution roadmaps',
    },
    focus: {
      title: 'Deep Focus Mode',
      subtitle: 'Distraction-free flow timer, ambient audio synthesis, and checklist',
    },
    schedule: {
      title: 'Optimized Daily Schedule',
      subtitle: 'Constraint-aware timeline, conflict resolution, and dynamic rebalancing',
    },
    analytics: {
      title: 'Productivity Analytics',
      subtitle: 'Historical trends, planned vs. actual focus velocity, and completion rate',
    },
    settings: {
      title: 'Workspace Settings',
      subtitle: 'Configure working hours, focus intervals, audio preferences, and AI keys',
    },
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const { title, subtitle } = titles[currentTab] || titles.overview;

  return (
    <header className="border-b border-slate-800/80 bg-[#090b14]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Date & Focus Minutes */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <CalendarIcon className="w-3.5 h-3.5 text-violet-400" />
          <span>{todayFormatted}</span>
          <span className="text-slate-600">|</span>
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-amber-300">{totalFocusMinutes}m Focus</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">{completedTasksCount}/{totalTasksCount} Done</span>
        </div>

        {/* Adapt Plan Action */}
        <button
          id="header-adapt-plan-btn"
          onClick={onAdaptPlan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          title="Recalculate schedule based on current progress and delays"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Adapt Plan</span>
        </button>

        {/* Quick Launch Focus Mode */}
        <button
          id="header-start-focus-btn"
          onClick={onStartFocus}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Focus</span>
        </button>

        {/* Toggle AI Assistant */}
        <button
          onClick={onToggleAssistant}
          className="p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/40 text-violet-300 transition-all"
          title="Open AI Productivity Assistant"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
