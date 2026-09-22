import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  Sparkles,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserPreferences } from '../../types';

interface SettingsViewProps {
  preferences: UserPreferences;
  onSavePreferences: (prefs: Partial<UserPreferences>) => void;
  onResetToDemoData: () => void;
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  aiConfigured: boolean;
  aiProvider: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onSavePreferences,
  onResetToDemoData,
  onClearAllData,
  onExportData,
  onImportData,
  aiConfigured,
  aiProvider,
}) => {
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleChange = (field: keyof UserPreferences, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = onImportData(content);
        setImportStatus(success ? 'Data imported successfully!' : 'Invalid JSON format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-violet-400" />
            <span>Workspace & Agent Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure working hours, focus session cadence, break ratios, and server-side AI keys.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Hours & Capacity */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Working Window & Capacity Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workday Start Time:
              </label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => handleChange('workStartTime', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workday End Time:
              </label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => handleChange('workEndTime', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Daily Workload Limit (Hours):
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={formData.dailyWorkloadLimitHours}
                onChange={(e) => handleChange('dailyWorkloadLimitHours', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                User / Agent Commander Name:
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Focus & Break Rhythm */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
            <Zap className="w-4 h-4 text-violet-400" />
            <span>Focus & Break Interval Cadence</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Focus Session Block:
              </label>
              <select
                value={formData.focusDurationMinutes}
                onChange={(e) => handleChange('focusDurationMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value={25}>25 minutes (Pomodoro Classic)</option>
                <option value={45}>45 minutes (Optimal Deep Work)</option>
                <option value={50}>50 minutes (50/10 Rule)</option>
                <option value={60}>60 minutes (Intense Sprint)</option>
                <option value={90}>90 minutes (Ultradian Rhythm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Short Break Duration:
              </label>
              <select
                value={formData.shortBreakMinutes}
                onChange={(e) => handleChange('shortBreakMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Long Break Duration:
              </label>
              <select
                value={formData.longBreakMinutes}
                onChange={(e) => handleChange('longBreakMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 animate-fadeIn flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
        </div>
      </form>

      {/* AI Provider Status Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>AI Provider Configuration</span>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              aiConfigured
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}
          >
            {aiConfigured ? '🟢 Live Gemini Key Active' : '🔵 Smart Heuristic Fallback Engine'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Active Provider: <strong className="text-slate-200">{aiProvider}</strong>. To enable live Google Gemini API calls, create a <code className="text-violet-300">.env</code> file in the project root with:
        </p>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 select-all">
          GEMINI_API_KEY=your_gemini_api_key_here
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>FlowPilot adheres to zero frontend API key leakage. All keys remain safely on the backend.</span>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Data Persistence & Demo Backup</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Workspace JSON</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            <span>Import Workspace JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onResetToDemoData}
            className="px-4 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Hackathon Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all tasks and schedule?')) {
                onClearAllData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 text-xs font-bold transition-colors ml-auto"
          >
            Clear Workspace
          </button>
        </div>

        {importStatus && (
          <p className="text-xs font-semibold text-cyan-400 animate-fadeIn">{importStatus}</p>
        )}
      </div>
    </div>
  );
};
