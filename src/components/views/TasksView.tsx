import React, { useState } from 'react';
import {
  Plus,
  Search,
  Clock,
  Play,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  Square,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { Task, Priority, TaskStatus, Goal } from '../../types';
import { prioritizeTasks, getScoreBadge } from '../../utils/prioritization';

interface TasksViewProps {
  tasks: Task[];
  goals: Goal[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartFocus: (task: Task) => void;
  onOpenCreateTaskModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  goals,
  onSaveTask,
  onDeleteTask,
  onToggleTaskComplete,
  onToggleSubtask,
  onStartFocus,
  onOpenCreateTaskModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const prioritized = prioritizeTasks(tasks);

  // Apply filters
  const filteredTasks = prioritized.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (goalFilter !== 'all' && task.goalId !== goalFilter) return false;
    return true;
  });

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    const isCompleted = newStatus === 'completed';
    onSaveTask({
      ...task,
      status: newStatus,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Task Command Center</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {tasks.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent algorithmic prioritization dynamically re-ranks tasks based on deadline urgency, effort, and dependency DAGs.
          </p>
        </div>

        <button
          id="create-task-btn"
          onClick={onOpenCreateTaskModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Statuses</option>
            <option value="todo" className="bg-slate-900">Todo</option>
            <option value="in-progress" className="bg-slate-900">In Progress</option>
            <option value="completed" className="bg-slate-900">Completed</option>
            <option value="delayed" className="bg-slate-900">Delayed</option>
            <option value="blocked" className="bg-slate-900">Blocked</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
          <span className="text-slate-400 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Priorities</option>
            <option value="critical" className="bg-slate-900">Critical</option>
            <option value="high" className="bg-slate-900">High</option>
            <option value="medium" className="bg-slate-900">Medium</option>
            <option value="low" className="bg-slate-900">Low</option>
          </select>
        </div>

        {/* Goal Filter */}
        {goals.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
            <span className="text-slate-400 font-medium">Goal:</span>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all" className="bg-slate-900">All Goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No matching tasks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your filter parameters or click "New Task" to add a new task to your plan.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const badge = getScoreBadge(task.priorityScore || 50);
            const isExpanded = !!expandedTaskIds[task.id];
            const isBlocked = task.dependencies && task.dependencies.some(
              (d) => tasks.find((t) => t.id === d)?.status !== 'completed'
            );
            const parentGoal = goals.find((g) => g.id === task.goalId);

            return (
              <div
                key={task.id}
                className={`glass-panel p-4 rounded-2xl border transition-all ${
                  task.status === 'completed'
                    ? 'border-slate-800/60 opacity-65 bg-slate-950/40'
                    : 'border-slate-800 hover:border-violet-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-lg border border-slate-700 hover:border-emerald-400 flex items-center justify-center group-hover:border-slate-500" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold tracking-tight ${
                            task.status === 'completed' ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Priority badge with score */}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.color}`}
                        >
                          {task.priority} ({task.priorityScore ?? 50} pts)
                        </span>

                        {/* Status selector badge */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                            task.status === 'in-progress'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : task.status === 'delayed'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : task.status === 'blocked'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : task.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="todo" className="bg-slate-900">Todo</option>
                          <option value="in-progress" className="bg-slate-900">In Progress</option>
                          <option value="delayed" className="bg-slate-900">Delayed</option>
                          <option value="blocked" className="bg-slate-900">Blocked</option>
                          <option value="completed" className="bg-slate-900">Completed</option>
                        </select>

                        {isBlocked && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Blocked by Prereq
                          </span>
                        )}

                        {task.isSample && (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded">
                            Demo
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                      )}

                      {/* Meta Tags */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300 font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {task.estimatedMinutes}m est. {task.actualMinutes ? `(${task.actualMinutes}m logged)` : ''}
                        </span>

                        {parentGoal && (
                          <span className="flex items-center gap-1 text-violet-400 truncate max-w-xs">
                            <Tag className="w-3 h-3" />
                            {parentGoal.title}
                          </span>
                        )}

                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-slate-400">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}

                        {task.recommendedReason && (
                          <span className="text-violet-300/80 italic truncate max-w-md">
                            💡 {task.recommendedReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Focus</span>
                      </button>
                    )}

                    {/* Expand Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                        title={isExpanded ? 'Collapse subtasks' : 'View subtasks'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Accordion */}
                {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 pl-8">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Subtask Checklist:
                    </p>
                    <div className="space-y-1.5">
                      {task.subtasks.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                            st.completed
                              ? 'bg-slate-900/30 border-slate-800 text-slate-500 line-through'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-violet-500/30'
                          }`}
                        >
                          {st.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="flex-1">{st.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">{st.estimatedMinutes}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
