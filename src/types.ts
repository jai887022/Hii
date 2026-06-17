export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  subtasks: string[];
  completedSubtasks: string[]; // List of completed subtask strings
  tip?: string; // AI generated clever tip
  isRefining?: boolean; // Refining spinner state
  createdAt: string;
}

export interface SkillTemplate {
  id: string;
  title: string;
  description: string;
  iconName: "Brain" | "SearchCode" | "Sparkles" | "FileText" | "CheckSquare";
  option: "brainstorm" | "explain" | "polish" | "action-plan" | "custom";
  promptPlaceholder: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
