import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Timer,
  Calendar,
  BarChart3,
  Settings,
  Bot,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export type NavTab =
  | 'overview'
  | 'tasks'
  | 'planner'
  | 'focus'
  | 'schedule'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  aiConfigured: boolean;
  aiProvider: string;
  onToggleAssistant: () => void;
  activeFocusTaskTitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  aiConfigured,
  aiProvider,
  onToggleAssistant,
  activeFocusTaskTitle,
}) => {
  const [soundMuted, setSoundMuted] = React.useState(false);

  const toggleMute = () => {
    if (soundMuted) {
      setSoundMuted(false);
    } else {
      soundEngine.stop();
      setSoundMuted(true);
    }
  };

  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'My Tasks', icon: CheckSquare },
    { id: 'planner' as NavTab, label: 'AI Planner', icon: Sparkles, badge: 'AI' },
    { id: 'focus' as NavTab, label: 'Focus Mode', icon: Timer, highlight: !!activeFocusTaskTitle },
    { id: 'schedule' as NavTab, label: 'My Schedule', icon: Calendar },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c0e17]/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20">
              <div className="w-full h-full bg-[#0d0f1a] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-display">FlowPilot</span>
                <span className="text-[10px] font-semibold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30">
                  AGENT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Productivity Execution</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-white border border-violet-500/40 shadow-sm shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {item.badge}
                  </span>
                )}

                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800/60 space-y-2">
        {/* Active Focus Mode Quick Bar */}
        {activeFocusTaskTitle && currentTab !== 'focus' && (
          <button
            onClick={() => onSelectTab('focus')}
            className="w-full text-left p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/30 hover:border-violet-500/60 transition-all group"
          >
            <div className="flex items-center justify-between text-[11px] text-violet-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE FOCUS
              </span>
              <span>Resume ➜</span>
            </div>
            <p className="text-xs text-white truncate font-medium">{activeFocusTaskTitle}</p>
          </button>
        )}

        {/* AI Assistant Quick Trigger */}
        <button
          id="toggle-ai-assistant-btn"
          onClick={onToggleAssistant}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-900 border border-violet-500/30 hover:border-violet-400/60 transition-all text-xs text-slate-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-violet-600/30 flex items-center justify-center border border-violet-500/40">
              <Bot className="w-3.5 h-3.5 text-violet-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-semibold text-violet-200">AI Pilot Assistant</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-700/40">
            Ask AI
          </span>
        </button>

        {/* AI Provider Status Card */}
        <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-2 h-2 rounded-full ${
                aiConfigured ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span className="text-slate-400 truncate">{aiProvider}</span>
          </div>
          <button
            onClick={toggleMute}
            title={soundMuted ? 'Unmute ambient sound' : 'Mute sound'}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
