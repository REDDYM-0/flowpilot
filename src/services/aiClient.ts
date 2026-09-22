import { GeneratedPlan } from '../types';

export class AIClient {
  public static async getStatus(): Promise<{ configured: boolean; provider: string }> {
    try {
      const res = await fetch('/api/config/status');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { configured: false, provider: 'Heuristic Demo AI Engine' };
  }

  public static async generatePlan(
    goalText: string,
    dailyHours: number = 4,
    targetDays: number = 3
  ): Promise<GeneratedPlan> {
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText, dailyHours, targetDays }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend API request failed, falling back to client-side heuristics:', err);
    }

    // Client-side instant fallback in case backend is disconnected
    return this.fallbackPlan(goalText, targetDays);
  }

  public static async askAssistant(
    message: string,
    context: { tasks: any[]; goals: any[]; schedule: any[]; focusSessions: any[] }
  ): Promise<{ reply: string; isDemo: boolean }> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    const pending = context.tasks.filter((t) => t.status !== 'completed');
    const top = pending[0];
    return {
      reply: top
        ? `🎯 **Recommendation:** Start with **"${top.title}"** (${top.estimatedMinutes}m, \`${top.priority.toUpperCase()}\`). Launch Focus Mode now to get into deep flow!`
        : `🎉 You have conquered all pending tasks for today! Great momentum.`,
      isDemo: true,
    };
  }

  private static fallbackPlan(goalText: string, targetDays: number): GeneratedPlan {
    return {
      goalTitle: `🎯 Structured Execution Plan: ${goalText.slice(0, 40)}`,
      goalDescription: `Deconstructed high-impact action roadmap for: "${goalText}"`,
      category: 'Productivity & Execution',
      totalEstimatedMinutes: 240,
      suggestedDays: targetDays || 2,
      tasks: [
        {
          title: 'Establish Scope, Deliverables & Pre-requisites',
          description: 'Define clear boundary conditions, outline milestones, and clear blockers.',
          priority: 'critical',
          estimatedMinutes: 45,
          subtasks: [
            { title: 'Define success criteria & key outputs', estimatedMinutes: 15 },
            { title: 'Gather reference material & tools', estimatedMinutes: 15 },
            { title: 'List potential risks & mitigations', estimatedMinutes: 15 },
          ],
          recommendedReason: 'Foundational step before high-effort execution.',
          energyLevel: 'high',
        },
        {
          title: 'Deep Execution: Primary Feature / Deliverable Build',
          description: 'Concentrated focus block on the hardest core components.',
          priority: 'high',
          estimatedMinutes: 75,
          subtasks: [
            { title: 'Implement primary core module', estimatedMinutes: 45 },
            { title: 'Run validation test and edge-case verification', estimatedMinutes: 30 },
          ],
          recommendedReason: 'Main value-creation block.',
          energyLevel: 'high',
        },
        {
          title: 'Refinement, Review, and Delivery Package',
          description: 'Final polishing, presentation readiness, and post-task audit.',
          priority: 'medium',
          estimatedMinutes: 45,
          subtasks: [
            { title: 'Conduct comprehensive review', estimatedMinutes: 25 },
            { title: 'Finalize output documentation', estimatedMinutes: 20 },
          ],
          recommendedReason: 'Guarantees presentation quality.',
          energyLevel: 'medium',
        },
      ],
      aiProductivityInsight: '💡 Tackle the hardest subtask in your first focus block when cognitive energy is highest.',
      isDemo: true,
    };
  }
}
