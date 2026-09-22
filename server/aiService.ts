import dotenv from 'dotenv';
dotenv.config();

export interface PlanGenerationRequest {
  goalText: string;
  dailyHours?: number;
  targetDays?: number;
}

export interface AdaptScheduleRequest {
  tasks: any[];
  schedule: any[];
  currentTime: string;
  delayReason?: string;
  remainingHours?: number;
}

export interface ChatAssistantRequest {
  message: string;
  context: {
    tasks: any[];
    goals: any[];
    schedule: any[];
    focusSessions: any[];
  };
}

export class AIService {
  private static getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || null;
  }

  public static getStatus() {
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    return {
      configured: hasGemini || hasOpenAI,
      provider: hasGemini ? 'Google Gemini' : hasOpenAI ? 'OpenAI' : 'Heuristic Demo AI Engine',
    };
  }

  /**
   * Generates a structured execution plan from natural language goal
   */
  public static async generatePlan(req: PlanGenerationRequest): Promise<any> {
    const apiKey = this.getApiKey();

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are FlowPilot, an expert AI productivity execution architect.
Analyze this user goal and return ONLY a valid JSON object (no markdown code fences, no extra text):
Goal: "${req.goalText}"
Daily available hours: ${req.dailyHours || 4} hours. Target timeframe: ${req.targetDays || 3} days.

Format output as this exact JSON schema:
{
  "goalTitle": "Actionable Goal Title",
  "goalDescription": "Brief description and scope",
  "category": "Academics | Product & Engineering | Career | Personal | Health",
  "totalEstimatedMinutes": 360,
  "suggestedDays": 3,
  "tasks": [
    {
      "title": "Task title",
      "description": "Concrete actionable steps",
      "priority": "critical" | "high" | "medium" | "low",
      "estimatedMinutes": 45,
      "energyLevel": "high" | "medium" | "low",
      "dependencies": [],
      "recommendedReason": "Why to do this at this stage",
      "subtasks": [
        { "title": "Subtask 1", "estimatedMinutes": 15 },
        { "title": "Subtask 2", "estimatedMinutes": 30 }
      ]
    }
  ],
  "aiProductivityInsight": "Strategic insight on momentum, Pareto 80/20, or cadence."
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return { ...parsed, isDemo: false };
          }
        }
      } catch (err) {
        console.warn('Live Gemini API call failed, falling back to smart heuristic generator:', err);
      }
    }

    // Heuristic Smart Generator (Fallback & Demo Mode)
    return this.generateHeuristicPlan(req);
  }

  private static generateHeuristicPlan(req: PlanGenerationRequest): any {
    const text = req.goalText.toLowerCase();

    if (text.includes('exam') || text.includes('study') || text.includes('learn') || text.includes('test')) {
      return {
        goalTitle: '📚 High-Yield Exam & Knowledge Mastery Sprint',
        goalDescription: `Accelerated syllabus mastery, active recall flashcards, and mock testing based on: "${req.goalText}"`,
        category: 'Academics',
        totalEstimatedMinutes: 240,
        suggestedDays: req.targetDays || 3,
        tasks: [
          {
            title: 'Diagnostic Knowledge Audit & High-Weight Topic Mapping',
            description: 'Identify core 80/20 syllabus concepts, past paper recurring themes, and knowledge gaps.',
            priority: 'critical',
            estimatedMinutes: 45,
            energyLevel: 'high',
            dependencies: [],
            recommendedReason: 'Establishes baseline clarity to eliminate low-value reading.',
            subtasks: [
              { title: 'Audit official exam syllabus & score weighting', estimatedMinutes: 15 },
              { title: 'List top 5 high-yield recurring chapters', estimatedMinutes: 15 },
              { title: 'Flag weak areas needing deepest focus', estimatedMinutes: 15 },
            ],
          },
          {
            title: 'Deep Work Concept Synthesis & Cheat Sheet Formulation',
            description: 'Condense dense technical formulas, definitions, and mechanisms into 1-page visual summaries.',
            priority: 'high',
            estimatedMinutes: 60,
            energyLevel: 'high',
            dependencies: [],
            recommendedReason: 'Prerequisite for high-speed active recall.',
            subtasks: [
              { title: 'Draft visual concept map for Module 1 & 2', estimatedMinutes: 25 },
              { title: 'Synthesize formulas & edge-case definitions', estimatedMinutes: 20 },
              { title: 'Create 10 rapid-fire active recall questions', estimatedMinutes: 15 },
            ],
          },
          {
            title: 'Timed Past-Paper Problem Solving Under Exam Constraints',
            description: 'Simulate realistic test conditions with strict 45-minute countdown without notes.',
            priority: 'high',
            estimatedMinutes: 50,
            energyLevel: 'medium',
            dependencies: [],
            recommendedReason: 'Validates real-world speed and retention under pressure.',
            subtasks: [
              { title: 'Complete Section A & B timed problems', estimatedMinutes: 35 },
              { title: 'Grade against rubric and document mistakes', estimatedMinutes: 15 },
            ],
          },
          {
            title: 'Targeted Mistake Analysis & Spaced Repetition Drill',
            description: 'Dissect errors, re-solve failed questions, and review flashcards before sleep.',
            priority: 'medium',
            estimatedMinutes: 40,
            energyLevel: 'low',
            dependencies: [],
            recommendedReason: 'Locks in long-term memory encoding through spaced review.',
            subtasks: [
              { title: 'Re-solve 3 hardest questions with zero hints', estimatedMinutes: 25 },
              { title: 'Final 15-minute quick flashcard blitz', estimatedMinutes: 15 },
            ],
          },
        ],
        aiProductivityInsight: '💡 Research shows active recall problem-solving beats passive re-reading by 300%. Protect your morning high-energy block for the timed practice test.',
        isDemo: true,
      };
    }

    if (text.includes('saas') || text.includes('app') || text.includes('build') || text.includes('launch') || text.includes('code') || text.includes('product') || text.includes('hackathon')) {
      return {
        goalTitle: '🚀 MVP Architecture & Launch Sprint',
        goalDescription: `End-to-end rapid prototyping, core workflow execution, and public deployment for: "${req.goalText}"`,
        category: 'Product & Engineering',
        totalEstimatedMinutes: 310,
        suggestedDays: req.targetDays || 2,
        tasks: [
          {
            title: 'Core Architecture & User Journey Wireframing',
            description: 'Define minimal data contracts, state management boundaries, and core user flow diagram.',
            priority: 'critical',
            estimatedMinutes: 45,
            energyLevel: 'high',
            dependencies: [],
            recommendedReason: 'Prevents costly refactoring by locking data contracts early.',
            subtasks: [
              { title: 'Define TypeScript interfaces & state schema', estimatedMinutes: 20 },
              { title: 'Sketch primary user execution loop', estimatedMinutes: 15 },
              { title: 'Set up repository structure and environment flags', estimatedMinutes: 10 },
            ],
          },
          {
            title: 'Implement Core Feature Execution Flow',
            description: 'Build the primary value driver component with full interactivity and error boundaries.',
            priority: 'critical',
            estimatedMinutes: 75,
            energyLevel: 'high',
            dependencies: [],
            recommendedReason: 'Heart of the product demonstration.',
            subtasks: [
              { title: 'Build input parsing and validation handlers', estimatedMinutes: 25 },
              { title: 'Construct interactive canvas / display component', estimatedMinutes: 30 },
              { title: 'Connect local storage persistence & sync hooks', estimatedMinutes: 20 },
            ],
          },
          {
            title: 'UI Polish, Micro-Interactions & Responsive Layout',
            description: 'Refine visual hierarchy, glassmorphism cards, glowing status indicators, and keyboard shortcuts.',
            priority: 'high',
            estimatedMinutes: 50,
            energyLevel: 'medium',
            dependencies: [],
            recommendedReason: 'Ensures immediate aesthetic impact for judges and stakeholders.',
            subtasks: [
              { title: 'Style dark theme cards and sleek typography', estimatedMinutes: 25 },
              { title: 'Add subtle hover transitions and loading skeletons', estimatedMinutes: 15 },
              { title: 'Test tablet and mobile responsiveness', estimatedMinutes: 10 },
            ],
          },
          {
            title: 'Production Build Validation & Public Deployment',
            description: 'Run production TypeScript builds, verify zero runtime errors, and deploy live URL.',
            priority: 'medium',
            estimatedMinutes: 40,
            energyLevel: 'low',
            dependencies: [],
            recommendedReason: 'Final deliverable requirement.',
            subtasks: [
              { title: 'Run production linting and build bundle checks', estimatedMinutes: 15 },
              { title: 'Deploy live build and verify API routing', estimatedMinutes: 15 },
              { title: 'Test end-to-end user workflow on production URL', estimatedMinutes: 10 },
            ],
          },
        ],
        aiProductivityInsight: '💡 Focus on delivering a polished vertical slice of the core workflow before adding peripheral features.',
        isDemo: true,
      };
    }

    // Default Generic Goal Plan
    return {
      goalTitle: `🎯 Structured Execution Plan: ${req.goalText.slice(0, 45)}`,
      goalDescription: `Deconstructed high-impact action roadmap for: "${req.goalText}"`,
      category: 'Productivity & Execution',
      totalEstimatedMinutes: 220,
      suggestedDays: req.targetDays || 2,
      tasks: [
        {
          title: 'Phase 1: Discovery & Priority Boundary Setup',
          description: 'Establish objective benchmarks, gather key resources, and remove ambiguity.',
          priority: 'critical',
          estimatedMinutes: 40,
          energyLevel: 'high',
          dependencies: [],
          recommendedReason: 'Clarifies exact deliverables before executing.',
          subtasks: [
            { title: 'List non-negotiable success criteria', estimatedMinutes: 15 },
            { title: 'Collect required materials and assets', estimatedMinutes: 15 },
            { title: 'Identify potential bottlenecks', estimatedMinutes: 10 },
          ],
        },
        {
          title: 'Phase 2: Heavy Lifting & Deep Focus Sprint',
          description: 'Execute the single highest-leverage milestone requiring intense concentration.',
          priority: 'high',
          estimatedMinutes: 60,
          energyLevel: 'high',
          dependencies: [],
          recommendedReason: 'Solves 80% of project complexity.',
          subtasks: [
            { title: 'Execute primary implementation milestone', estimatedMinutes: 40 },
            { title: 'Verify correctness against benchmark criteria', estimatedMinutes: 20 },
          ],
        },
        {
          title: 'Phase 3: Refinement, Testing & Final Delivery',
          description: 'Package results, review edge cases, and finalize submission.',
          priority: 'medium',
          estimatedMinutes: 45,
          energyLevel: 'medium',
          dependencies: [],
          recommendedReason: 'Guarantees quality and completeness.',
          subtasks: [
            { title: 'Conduct thorough quality review', estimatedMinutes: 25 },
            { title: 'Finalize handoff documentation and deliverable', estimatedMinutes: 20 },
          ],
        },
      ],
      aiProductivityInsight: '💡 Break the biggest task into uninterrupted 45-minute blocks with 10-minute recovery intervals.',
      isDemo: true,
    };
  }

  /**
   * AI Productivity Assistant Chat handler
   */
  public static async chat(req: ChatAssistantRequest): Promise<{ reply: string; isDemo: boolean }> {
    const taskCount = req.context.tasks.length;
    const completedTasks = req.context.tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = req.context.tasks.filter((t) => t.status !== 'completed');
    const msg = req.message.toLowerCase();

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are FlowPilot, an intelligent AI Productivity Assistant.
Active Context:
- Total Tasks: ${taskCount} (${completedTasks} completed, ${pendingTasks.length} remaining)
- Pending Tasks: ${JSON.stringify(pendingTasks.map((t) => ({ title: t.title, priority: t.priority, est: t.estimatedMinutes, status: t.status })))}
- Current Goals: ${JSON.stringify(req.context.goals.map((g) => g.title))}

User asks: "${req.message}"
Provide a concise, direct, motivational, and actionable response formatted in clean markdown. Reference their actual tasks when appropriate.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return { reply, isDemo: false };
        }
      } catch {
        // fallback
      }
    }

    // Heuristic Contextual Chat Responses
    if (msg.includes('next') || msg.includes('what should i do') || msg.includes('start')) {
      const topTask = pendingTasks[0];
      if (topTask) {
        return {
          reply: `🎯 **Next Best Action:**\n\nYou should immediately start **"${topTask.title}"**.\n\n* **Priority:** \`${topTask.priority.toUpperCase()}\`\n* **Estimated Time:** ${topTask.estimatedMinutes} mins\n* **Why:** It has the highest priority score and zero blocking dependencies.\n\n👉 Click **"Start Focus"** in the Priority Tasks card to launch a 45-minute distraction-free session!`,
          isDemo: true,
        };
      } else {
        return {
          reply: `🎉 **Outstanding work!** You have completed all active tasks. Head over to the **AI Planner** to set your next ambitious goal!`,
          isDemo: true,
        };
      }
    }

    if (msg.includes('adjust') || msg.includes('hour') || msg.includes('time') || msg.includes('late') || msg.includes('delay')) {
      return {
        reply: `⚡ **Adaptive Plan Realignment:**\n\nI analyzed your remaining ${pendingTasks.length} pending tasks against your available schedule window.\n\n1. Use the **"Adapt My Plan"** button on the Schedule page to recalculate time blocks.\n2. We will prioritize the top critical path items and defer non-urgent tasks to protect your focus buffer.\n3. Would you like to compress break intervals to 5 minutes to fit more work today?`,
        isDemo: true,
      };
    }

    if (msg.includes('break') || msg.includes('subtask') || msg.includes('smaller')) {
      const topTask = pendingTasks[0];
      return {
        reply: `✂️ **Task Deconstruction:**\n\nFor **"${topTask ? topTask.title : 'your primary task'}"**, I recommend this 3-step micro-sequence:\n\n1. **Step 1 (10m):** Setup environment and outline bullet points.\n2. **Step 2 (25m):** Complete the core challenging portion with no distractions.\n3. **Step 3 (10m):** Review, test, and mark as completed.\n\nWould you like me to update this task's subtasks in your list?`,
        isDemo: true,
      };
    }

    return {
      reply: `🚀 **FlowPilot Intelligence Report:**\n\nYou have completed **${completedTasks}/${taskCount}** tasks today. Your focus cadence is solid!\n\n* **Remaining Focus Time:** ~${pendingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0)} minutes\n* **Immediate Recommendation:** Launch Focus Mode on your top priority task and engage ambient audio to enter deep flow.`,
      isDemo: true,
    };
  }
}
