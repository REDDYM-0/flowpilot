import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  ListTodo,
  CheckSquare,
  Square,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, FocusSession } from '../../types';
import { soundEngine } from '../../utils/audio';

interface FocusViewProps {
  activeTask?: Task | null;
  allTasks: Task[];
  onSelectTask: (task: Task) => void;
  onLogSession: (session: FocusSession) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  defaultDurationMinutes?: number;
}

export const FocusView: React.FC<FocusViewProps> = ({
  activeTask,
  allTasks,
  onSelectTask,
  onLogSession,
  onToggleTaskComplete,
  onToggleSubtask,
  defaultDurationMinutes = 45,
}) => {
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(defaultDurationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  const [ambientSound, setAmbientSound] = useState<'none' | 'white' | 'rain' | 'binaural' | 'waves'>('none');
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Drift-proof timer using timestamp delta
  const targetEndTimeRef = useRef<number | null>(null);
  const accumulatedElapsedRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  // Sync with duration change
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setSecondsRemaining(durationMinutes * 60);
    }
  }, [durationMinutes, isRunning, isPaused]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;

      intervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsRemaining(diff);
        setSessionElapsedSeconds((prev) => prev + 1);

        if (diff <= 0) {
          clearInterval(intervalRef.current);
          handleTimerComplete();
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Ambient sound update
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      soundEngine.playSound(ambientSound, soundVolume);
    } else if (!isRunning) {
      soundEngine.stop();
    }
  }, [ambientSound, isRunning, soundVolume]);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
    accumulatedElapsedRef.current += sessionElapsedSeconds;
    soundEngine.stop();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSecondsRemaining(durationMinutes * 60);
    setSessionStartTime(null);
    setSessionElapsedSeconds(0);
    soundEngine.stop();
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    soundEngine.stop();
    soundEngine.playCompletionChime();

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#06b6d4', '#f59e0b', '#10b981'],
      });
    } catch {
      // ignore
    }

    setShowCompletionModal(true);
  };

  const handleFinishEarly = () => {
    if (sessionElapsedSeconds > 30) {
      handleTimerComplete();
    } else {
      handleReset();
    }
  };

  const submitSessionLog = (taskCompleted: boolean) => {
    const actualMins = Math.max(1, Math.round(sessionElapsedSeconds / 60));

    const session: FocusSession = {
      id: `fs_${Date.now()}`,
      taskId: activeTask?.id,
      taskTitle: activeTask?.title || 'General Deep Focus Sprint',
      targetMinutes: durationMinutes,
      actualMinutes: actualMins,
      startTime: sessionStartTime ? new Date(sessionStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'completed',
      notes: sessionNotes,
      date: new Date().toISOString().split('T')[0],
      subtasksCompleted: activeTask?.subtasks?.filter((s) => s.completed).length || 0,
    };

    onLogSession(session);

    if (taskCompleted && activeTask) {
      onToggleTaskComplete(activeTask.id);
    }

    setShowCompletionModal(false);
    handleReset();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Time calculations
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const totalSeconds = durationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  const incompleteTasks = allTasks.filter((t) => t.status !== 'completed');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header & Task Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-violet-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Current Focus Target</span>
            <div className="flex items-center gap-2">
              <select
                value={activeTask?.id || ''}
                onChange={(e) => {
                  const found = allTasks.find((t) => t.id === e.target.value);
                  if (found) onSelectTask(found);
                }}
                className="bg-transparent font-bold text-base text-white outline-none cursor-pointer hover:text-violet-300 transition-colors max-w-md truncate"
              >
                {activeTask ? (
                  <option value={activeTask.id} className="bg-slate-900 text-white">
                    {activeTask.title}
                  </option>
                ) : (
                  <option value="" className="bg-slate-900 text-slate-400">
                    Select a task to focus on...
                  </option>
                )}
                {incompleteTasks
                  .filter((t) => t.id !== activeTask?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      [{t.priority.toUpperCase()}] {t.title} ({t.estimatedMinutes}m)
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ambient Noise Selector & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Sound preset */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            {ambientSound === 'none' ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            )}
            <select
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value as any)}
              className="bg-transparent text-slate-300 outline-none cursor-pointer"
            >
              <option value="none" className="bg-slate-900">No Sound</option>
              <option value="rain" className="bg-slate-900">🌧️ Pink Rain Drone</option>
              <option value="binaural" className="bg-slate-900">🧠 40Hz Gamma Focus</option>
              <option value="white" className="bg-slate-900">💨 White Noise</option>
              <option value="waves" className="bg-slate-900">🌊 Ocean Ambient</option>
            </select>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Distraction-free fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Command Ring & Controls */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-2xl">
        {/* Glow ambient background */}
        <div
          className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isRunning
              ? 'bg-violet-600/20 scale-110'
              : isPaused
              ? 'bg-amber-600/15 scale-95'
              : 'bg-indigo-600/10 scale-90'
          }`}
        />

        {/* Task Title & Description in focus */}
        <div className="relative z-10 max-w-xl mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-violet-400 font-bold px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/50">
            {activeTask ? `${activeTask.priority.toUpperCase()} PRIORITY SPRINT` : 'DEEP WORK SPRINT'}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-3">
            {activeTask ? activeTask.title : 'Deep Flow Session'}
          </h2>
          {activeTask?.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activeTask.description}</p>
          )}
        </div>

        {/* Circular Progress & Huge Digital Timer */}
        <div className="relative z-10 my-4 flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-800/80"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Animated Progress Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="transition-all duration-1000 ease-linear"
                stroke={isRunning ? 'url(#focusGradient)' : '#6366f1'}
                strokeWidth="5"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Digital Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
                {timeFormatted}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2">
                {isRunning ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Deep Flow Active
                  </span>
                ) : isPaused ? (
                  <span className="text-amber-400">Paused</span>
                ) : (
                  'Ready to Focus'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Duration Changers (when not running) */}
        {!isRunning && !isPaused && (
          <div className="relative z-10 flex items-center gap-2 my-4">
            {[15, 25, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  durationMinutes === mins
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Main Controls */}
        <div className="relative z-10 flex items-center gap-4 mt-4">
          {!isRunning ? (
            <button
              id="focus-start-btn"
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isPaused ? 'Resume Session' : 'Begin Focus Session'}</span>
            </button>
          ) : (
            <button
              id="focus-pause-btn"
              onClick={handlePause}
              className="px-6 py-3.5 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Timer</span>
            </button>
          )}

          {(isRunning || isPaused) && (
            <button
              id="focus-finish-btn"
              onClick={handleFinishEarly}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all hover:text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>End & Log</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtask Checklist in Focus Mode */}
      {activeTask && activeTask.subtasks && activeTask.subtasks.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-cyan-400" />
              <span>Session Execution Checklist</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {activeTask.subtasks.filter((s) => s.completed).length}/{activeTask.subtasks.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {activeTask.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                onClick={() => onToggleSubtask(activeTask.id, subtask.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  subtask.completed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through'
                    : 'bg-slate-900/60 border-slate-800 hover:border-violet-500/40 text-slate-200'
                }`}
              >
                {subtask.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="text-xs font-medium flex-1">{subtask.title}</span>
                <span className="text-[10px] font-mono text-slate-500">{subtask.estimatedMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 md:p-8 rounded-2xl border border-violet-500/40 max-w-md w-full space-y-5 animate-scaleUp shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Focus Session Complete!</h3>
              <p className="text-xs text-slate-400">
                You focused for{' '}
                <span className="text-cyan-300 font-semibold font-mono">
                  {Math.max(1, Math.round(sessionElapsedSeconds / 60))} minutes
                </span>{' '}
                on {activeTask ? `"${activeTask.title}"` : 'your goal'}.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Session notes or insights (optional):
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What was completed or what are the next steps?"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Task completion prompt */}
            {activeTask && activeTask.status !== 'completed' && (
              <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-slate-300">
                <p className="font-semibold text-white mb-2">Did you finish this task completely?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => submitSessionLog(true)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Yes, Mark Done</span>
                  </button>
                  <button
                    onClick={() => submitSessionLog(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                  >
                    Still In-Progress
                  </button>
                </div>
              </div>
            )}

            {!activeTask && (
              <button
                onClick={() => submitSessionLog(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs"
              >
                Log Focus Session
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
