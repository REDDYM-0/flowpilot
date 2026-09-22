import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Calendar, Layers, Sparkles } from 'lucide-react';
import { Task, Priority, Goal } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Task) => void;
  goals: Goal[];
  existingTasks: Task[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  goals,
  existingTasks,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [goalId, setGoalId] = useState('');
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Array<{ title: string; estimatedMinutes: number }>>([
    { title: 'Initial setup & requirements', estimatedMinutes: 15 },
  ]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    setSubtasks((prev) => [...prev, { title: '', estimatedMinutes: 15 }]);
  };

  const handleUpdateSubtask = (idx: number, field: string, value: any) => {
    const updated = [...subtasks];
    updated[idx] = { ...updated[idx], [field]: value };
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskId = `task_${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      priority,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      actualMinutes: 0,
      deadline: deadline || undefined,
      goalId: goalId || undefined,
      dependencies,
      status: 'todo',
      executionOrder: existingTasks.length + 1,
      createdAt: new Date().toISOString(),
      subtasks: subtasks
        .filter((s) => s.title.trim())
        .map((s, idx) => ({
          id: `st_${Date.now()}_${idx}`,
          taskId: taskId,
          title: s.title.trim(),
          completed: false,
          estimatedMinutes: s.estimatedMinutes || 15,
        })),
      isSample: false,
    };

    onSaveTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-violet-500/40 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-scaleUp shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">Create New Actionable Task</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Interactive Timeline Visualizer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Concrete details, acceptance criteria, or key constraints..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Tier</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Est. Minutes</span>
              </label>
              <input
                type="number"
                min={5}
                max={360}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-violet-400" />
                <span>Deadline</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Goal selection */}
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Link to Goal (Optional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-violet-500"
              >
                <option value="">No parent goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Actionable Subtasks</label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subtask
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => handleUpdateSubtask(i, 'title', e.target.value)}
                    placeholder={`Subtask ${i + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-slate-700"
                  />
                  <input
                    type="number"
                    value={st.estimatedMinutes}
                    onChange={(e) => handleUpdateSubtask(i, 'estimatedMinutes', Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none text-right font-mono"
                  />
                  <span className="text-[10px] text-slate-500">m</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(i)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
