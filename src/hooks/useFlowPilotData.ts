import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import {
  Goal,
  Task,
  ScheduleBlock,
  FocusSession,
  UserPreferences,
  ChatMessage,
} from '../types';

export function useFlowPilotData() {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    StorageService.getPreferences()
  );
  const [goals, setGoals] = useState<Goal[]>(() => StorageService.getGoals());
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(() =>
    StorageService.getScheduleBlocks()
  );
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() =>
    StorageService.getFocusSessions()
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    StorageService.getChatMessages()
  );

  const reloadData = useCallback(() => {
    setPreferences(StorageService.getPreferences());
    setGoals(StorageService.getGoals());
    setTasks(StorageService.getTasks());
    setSchedule(StorageService.getScheduleBlocks());
    setFocusSessions(StorageService.getFocusSessions());
    setChatMessages(StorageService.getChatMessages());
  }, []);

  useEffect(() => {
    StorageService.init();
    reloadData();

    const handleDataChange = () => {
      reloadData();
    };

    window.addEventListener('flowpilot-data-change', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    return () => {
      window.removeEventListener('flowpilot-data-change', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [reloadData]);

  return {
    preferences,
    goals,
    tasks,
    schedule,
    focusSessions,
    chatMessages,
    reloadData,
    savePreferences: StorageService.savePreferences.bind(StorageService),
    saveGoal: StorageService.saveGoal.bind(StorageService),
    deleteGoal: StorageService.deleteGoal.bind(StorageService),
    saveTask: StorageService.saveTask.bind(StorageService),
    saveTasks: StorageService.saveTasks.bind(StorageService),
    deleteTask: StorageService.deleteTask.bind(StorageService),
    toggleTaskCompletion: StorageService.toggleTaskCompletion.bind(StorageService),
    toggleSubtask: StorageService.toggleSubtask.bind(StorageService),
    saveScheduleBlocks: StorageService.saveScheduleBlocks.bind(StorageService),
    updateScheduleBlock: StorageService.updateScheduleBlock.bind(StorageService),
    logFocusSession: StorageService.logFocusSession.bind(StorageService),
    addChatMessage: StorageService.addChatMessage.bind(StorageService),
    clearChat: StorageService.clearChat.bind(StorageService),
    resetToSampleData: StorageService.resetToSampleData.bind(StorageService),
    clearAllData: StorageService.clearAllData.bind(StorageService),
    exportAllData: StorageService.exportAllData.bind(StorageService),
    importData: StorageService.importData.bind(StorageService),
  };
}
