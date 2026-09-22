import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/views/OverviewView';
import { TasksView } from './components/views/TasksView';
import { PlannerView } from './components/views/PlannerView';
import { FocusView } from './components/views/FocusView';
import { ScheduleView } from './components/views/ScheduleView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { AdaptPlanModal } from './components/modals/AdaptPlanModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { useFlowPilotData } from './hooks/useFlowPilotData';
import { Task, Goal, ScheduleConflict } from './types';
import { generateDailySchedule } from './utils/scheduler';
import { AIClient } from './services/aiClient';

export function App() {
  const {
    preferences,
    goals,
    tasks,
    schedule,
    focusSessions,
    chatMessages,
    savePreferences,
    saveGoal,
    saveTask,
    saveTasks,
    deleteTask,
    toggleTaskCompletion,
    toggleSubtask,
    saveScheduleBlocks,
    updateScheduleBlock,
    logFocusSession,
    addChatMessage,
    clearChat,
    resetToSampleData,
    clearAllData,
    exportAllData,
    importData,
  } = useFlowPilotData();

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [plannerInitialPrompt, setPlannerInitialPrompt] = useState<string>('');
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAdaptModalOpen, setIsAdaptModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; provider: string }>({
    configured: false,
    provider: 'Heuristic Demo AI Engine',
  });

  // Fetch AI provider status on mount
  useEffect(() => {
    AIClient.getStatus().then(setAiStatus);
  }, []);

  // Compute focus minutes for today
  const todayStr = new Date().toISOString().split('T')[0];
  const focusMinutesToday = focusSessions
    .filter((s) => s.date === todayStr || (s.startTime && s.startTime.startsWith(todayStr)))
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

  // Core Schedule Generation
  const handleGenerateSchedule = () => {
    const result = generateDailySchedule(tasks, preferences, todayStr);
    saveScheduleBlocks(result.blocks);
    setScheduleConflicts(result.conflicts);
  };

  // When user accepts an AI-generated plan
  const handleAcceptPlan = (newGoal: Goal, newTasks: Task[]) => {
    saveGoal(newGoal);
    saveTasks(newTasks);

    // Automatically optimize and generate schedule
    const allPending = [...tasks.filter((t) => t.status !== 'completed'), ...newTasks];
    const result = generateDailySchedule(allPending, preferences, todayStr);
    saveScheduleBlocks(result.blocks);
    setScheduleConflicts(result.conflicts);

    // Set first task as active focus target
    if (newTasks.length > 0) {
      setActiveFocusTask(newTasks[0]);
    }
  };

  // Launch Focus Mode on specific task
  const handleStartFocusOnTask = (task: Task) => {
    setActiveFocusTask(task);
    setCurrentTab('focus');
  };

  const handleLaunchDefaultFocus = () => {
    if (!activeFocusTask) {
      const topPending = tasks.find((t) => t.status !== 'completed');
      if (topPending) setActiveFocusTask(topPending);
    }
    setCurrentTab('focus');
  };

  const handleNavigateToPlanner = (initialPrompt?: string) => {
    if (initialPrompt) setPlannerInitialPrompt(initialPrompt);
    setCurrentTab('planner');
  };

  const handleExportData = () => {
    const dataStr = exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowpilot_backup_${todayStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-[#08090f] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        aiConfigured={aiStatus.configured}
        aiProvider={aiStatus.provider}
        onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
        activeFocusTaskTitle={activeFocusTask?.title}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          onStartFocus={handleLaunchDefaultFocus}
          onAdaptPlan={() => setIsAdaptModalOpen(true)}
          onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
          completedTasksCount={tasks.filter((t) => t.status === 'completed').length}
          totalTasksCount={tasks.length}
          totalFocusMinutes={focusMinutesToday}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 pb-16">
          {currentTab === 'overview' && (
            <OverviewView
              tasks={tasks}
              schedule={schedule}
              preferences={preferences}
              focusMinutesToday={focusMinutesToday}
              onNavigateToPlanner={handleNavigateToPlanner}
              onNavigateToTasks={() => setCurrentTab('tasks')}
              onNavigateToSchedule={() => setCurrentTab('schedule')}
              onStartFocusOnTask={handleStartFocusOnTask}
              onToggleTaskComplete={toggleTaskCompletion}
              onAdaptPlan={() => setIsAdaptModalOpen(true)}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              goals={goals}
              onSaveTask={saveTask}
              onDeleteTask={deleteTask}
              onToggleTaskComplete={toggleTaskCompletion}
              onToggleSubtask={toggleSubtask}
              onStartFocus={handleStartFocusOnTask}
              onOpenCreateTaskModal={() => setIsCreateTaskModalOpen(true)}
            />
          )}

          {currentTab === 'planner' && (
            <PlannerView
              initialPrompt={plannerInitialPrompt}
              onAcceptPlan={handleAcceptPlan}
              onNavigateToSchedule={() => setCurrentTab('schedule')}
            />
          )}

          {currentTab === 'focus' && (
            <FocusView
              activeTask={activeFocusTask}
              allTasks={tasks}
              onSelectTask={setActiveFocusTask}
              onLogSession={logFocusSession}
              onToggleTaskComplete={toggleTaskCompletion}
              onToggleSubtask={toggleSubtask}
              defaultDurationMinutes={preferences.focusDurationMinutes}
            />
          )}

          {currentTab === 'schedule' && (
            <ScheduleView
              schedule={schedule}
              tasks={tasks}
              preferences={preferences}
              conflicts={scheduleConflicts}
              onGenerateSchedule={handleGenerateSchedule}
              onAdaptPlan={() => setIsAdaptModalOpen(true)}
              onStartFocusOnTask={handleStartFocusOnTask}
              onUpdateBlockStatus={(blockId, status) => {
                const found = schedule.find((b) => b.id === blockId);
                if (found) {
                  updateScheduleBlock({ ...found, status });
                }
              }}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              tasks={tasks}
              focusSessions={focusSessions}
              goals={goals}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              preferences={preferences}
              onSavePreferences={savePreferences}
              onResetToDemoData={resetToSampleData}
              onClearAllData={clearAllData}
              onExportData={handleExportData}
              onImportData={importData}
              aiConfigured={aiStatus.configured}
              aiProvider={aiStatus.provider}
            />
          )}
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        tasks={tasks}
        goals={goals}
        schedule={schedule}
        focusSessions={focusSessions}
        chatMessages={chatMessages}
        onAddMessage={addChatMessage}
        onClearChat={clearChat}
        onStartFocusOnTask={handleStartFocusOnTask}
      />

      {/* Adaptive Reschedule Modal */}
      <AdaptPlanModal
        isOpen={isAdaptModalOpen}
        onClose={() => setIsAdaptModalOpen(false)}
        tasks={tasks}
        schedule={schedule}
        preferences={preferences}
        onApplyAdaptedSchedule={(newBlocks) => {
          saveScheduleBlocks(newBlocks);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSaveTask={saveTask}
        goals={goals}
        existingTasks={tasks}
      />
    </div>
  );
}

export default App;
