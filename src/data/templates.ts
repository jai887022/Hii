import { SkillTemplate, Task } from "../types";

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "brainstorm",
    title: "Brainstorm Ideas",
    description: "Generate lateral ideas and creative angles with structured insights.",
    iconName: "Brain",
    option: "brainstorm",
    promptPlaceholder: "Brainstorm 5 unique startup ideas matching high-contrast workspace design..."
  },
  {
    id: "explain",
    title: "Simplify Mechanics",
    description: "Deconstruct complex ideas, technical concepts, or math into intuitive analogies.",
    iconName: "Sparkles",
    option: "explain",
    promptPlaceholder: "Explain quantum computing in under three sentences using a coin analogy..."
  },
  {
    id: "polish",
    title: "Refine Prose",
    description: "Polish grammar, elegance, rhythm, and clarity of your text instantly.",
    iconName: "FileText",
    option: "polish",
    promptPlaceholder: "Rewrite this draft to sound highly professional and concise: [Insert text here]"
  },
  {
    id: "action-plan",
    title: "Action Planner",
    description: "Transform an abstract concept into a cron-sequenced action roadmap.",
    iconName: "CheckSquare",
    option: "action-plan",
    promptPlaceholder: "Build a physical action plan to prepare for a multi-day outdoor hiking trip..."
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Set up target metrics",
    description: "Plan key targets for the quarterly workspace launch goals.",
    completed: false,
    subtasks: [
      "Select core engagement KPIs",
      "Draft timeline milestones"
    ],
    completedSubtasks: ["Select core engagement KPIs"],
    tip: "Keep metrics under 3 primary targets. Excess focal points fragment team attention and lead to decision paralysis.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "task-2",
    title: "Refine website copy",
    description: "Click 'AI Refine' on this item to automatically break it down into actionable steps!",
    completed: false,
    subtasks: [],
    completedSubtasks: [],
    createdAt: new Date().toISOString(),
  }
];
