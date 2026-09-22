# FlowPilot – AI Productivity Execution Agent

> **Transform natural-language goals into prioritized action roadmaps, optimized time-blocked schedules, distraction-free focus sessions, and adaptive execution velocity.**

Built for high-performance builders, students, and engineers participating in productivity hackathons.

---

## 🚀 Key Features & Capabilities

### 1. 🧠 AI Goal Decomposition & Planner
- **Natural Language Input**: Enter freeform goals (e.g. *"Prepare for my AI exam in 3 days with 5 modules and 2h daily available time"*).
- **Structured Roadmap**: Generates structured goal breakdowns containing prioritized tasks, time-estimated subtasks, energy ratings, and dependency DAG requirements.
- **Interactive Plan Editor**: Add, delete, customize subtasks, re-estimate durations, or regenerate plans before accepting.
- **Zero-Friction Schedule Sync**: One-click **"Accept Plan & Optimize Schedule"** instantly constructs your day.
- **Live AI & Demo Dual-Engine**: Seamlessly interfaces with Google Gemini API when configured, or provides immediate high-fidelity heuristic plans in demo mode with clear status attribution.

### 2. 🎯 Smart Multi-Factor Prioritization Engine
- Transparent mathematical scoring algorithm (0–100 scale) balancing:
  - **Deadline Urgency** (Overdue / Due today / Due in X days)
  - **Importance Tier** (Critical, High, Medium, Low)
  - **DAG Dependency Readiness** (Penalizes blocked items whose prerequisites are not yet completed)
  - **Effort Feasibility & Momentum** (Momentum bonus for high-impact quick wins)
- Explains **"Why this is next"** with clear natural-language reasoning on every task card.

### 3. 📅 Autonomous Constraint-Aware Scheduler
- Computes non-overlapping daily time blocks respecting:
  - Configurable working hours (e.g. `09:00` – `18:00`)
  - Focus session chunk sizes (25m / 45m / 50m / 60m)
  - Micro-breaks (5–10m) and long refresh breaks (15–30m)
  - Task dependencies (prerequisites are scheduled before dependent tasks)
  - Daily workload limits
- **Conflict Detection**: Alerts users to schedule overloads or tasks that exceed available hours with actionable mitigation advice.

### 4. ⚡ Distraction-Free Deep Focus Mode
- **Drift-Proof Timer**: Utilizes delta timestamp calculations (`Date.now()`) resilient to background browser tab throttling.
- **Embedded Web Audio Synthesis**: Generates real-time ambient focus sounds natively in the browser without external network dependencies:
  - 🌧️ *Pink Rain Drone*
  - 🧠 *40Hz Gamma Focus Binaural Beats*
  - 💨 *Pure White Noise*
  - 🌊 *Ocean Waves Drone*
- **Subtask Checklist**: Track and check off step-by-step milestones directly within focus mode.
- **Accurate Logging**: Prompts for task completion confirmation upon session end, logs actual focus minutes, and triggers celebratory confetti.

### 5. 🔄 Adaptive Real-Time Rescheduling ("Adapt My Plan")
- Handles real-world delays, meetings, and overtime tasks with a single click.
- Recalculates start times for all remaining pending tasks from the current time while strictly preserving all completed work and focus history.
- Displays an adaptation diff summary showing moved blocks and deferred items.

### 6. 📊 Productivity Telemetry & Analytics
- Visualized using **Recharts**:
  - **Daily & Weekly Focus Trends** (Area Chart)
  - **Planned vs. Actual Duration Accuracy** (Bar Chart)
  - **Weekly Task Completion Volume** (Bar Chart)
  - **Priority Breakdown Distribution** (Donut Chart)
- Calculates real-time execution velocity and sprint completion percentages from persistent storage.

### 7. 🤖 Context-Aware AI Productivity Assistant
- Accessible via slide-out drawer.
- Answers questions grounded in the user's live tasks, active schedule, deadlines, and completed milestones:
  - *"What should I work on next?"*
  - *"I only have 2 hours left today. Adjust my plan."*
  - *"Break my top task into smaller steps."*

### 8. 🛡️ Enterprise Data Privacy & Security
- **No API Keys in Frontend**: Server-side API key handling ensures secret keys are never exposed in browser localStorage or client bundles.
- **Local Persistence & Export**: Full workspace import/export in JSON, with options to reset or restore hackathon demo presets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| **Icons & Visuals** | Lucide React, Canvas Confetti |
| **Charts** | Recharts |
| **Audio** | Web Audio API Synthetic Noise & Chime Engine |
| **Backend / API** | Node.js, Express, TypeScript (tsx), CORS, Dotenv |
| **AI Provider** | Google Gemini 1.5 Flash API + Heuristic Demo Engine |
| **Storage** | Repository Pattern with LocalStorage Persistence & Sync Events |

---

## 📦 Installation & Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd "flow pilot"
npm install
```

### 2. Configure Environment Variables (Optional)
To enable live Google Gemini AI generation, create a `.env` file in the project root:
```env
PORT=3001
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If no key is provided, FlowPilot automatically operates in high-fidelity demo mode with instant realistic plans and assistant responses).*

### 3. Start Development Server
```bash
npm run dev
```
This starts:
- **Express Backend**: `http://localhost:3001`
- **Vite Client**: `http://localhost:5173`

---

## 🏗️ Production Build & Verification

### Build for Production
```bash
npm run build
```
This runs TypeScript type checking (`tsc -b`) and bundles the static assets in `./dist`.

### Preview Production Build
```bash
npm run preview
```

---

## 🚢 Deployment Guide (e.g. Vercel / Render / Cloud Run)

### Deploying to Vercel
1. Set the **Build Command** to: `npm run build`
2. Set the **Output Directory** to: `dist`
3. Set the **Install Command** to: `npm install`
4. In Vercel Project Settings > Environment Variables, add:
   - `GEMINI_API_KEY` (optional for live AI)

---

## 📋 Hackathon Demo Flow Cheat Sheet

1. **Overview Dashboard**: Observe the command-center layout, active priority tasks, and greeting.
2. **AI Goal Input**: Type *"Prepare for my AI exam in 3 days. I have 5 modules to study and can spend 2 hours each day"* and click **Generate My Plan**.
3. **Plan Review**: Review the decomposed tasks, edit subtasks, and click **Accept Plan & Optimize Schedule** (triggers confetti).
4. **My Schedule**: Notice how the tasks are scheduled into conflict-free time blocks with breaks.
5. **Start Focus**: Click **Focus** on the top critical task. Test the timer, toggle Binaural Beats / Rain audio, and complete subtasks.
6. **Adapt My Plan**: Mark a task as *Delayed* or click **Adapt Plan** to demonstrate real-time schedule rebalancing.
7. **Analytics**: Visit the Analytics tab to view real-time charts calculated from your session logs.
8. **AI Assistant**: Open the AI Assistant drawer and click *"What should I work on next?"* to show context grounding.
