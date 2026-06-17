import { useState, useEffect } from "react";
import { Task, ChatMessage } from "./types";
import { SKILL_TEMPLATES, INITIAL_TASKS } from "./data/templates";
import TaskCard from "./components/TaskCard";
import SmartOutput from "./components/SmartOutput";
import { 
  Plus, 
  Brain, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  RotateCcw, 
  Layers, 
  Bot, 
  Info,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Sync state with localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("smart_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
      }
    }
    return INITIAL_TASKS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("smart_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat messages", e);
      }
    }
    return [];
  });

  const [selectedOption, setSelectedOption] = useState<
    "brainstorm" | "explain" | "polish" | "action-plan" | "custom"
  >("brainstorm");

  const [inputPrompt, setInputPrompt] = useState<string>(
    SKILL_TEMPLATES[0].promptPlaceholder
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // New task form fields
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  // Persist tasks & messages changes
  useEffect(() => {
    localStorage.setItem("smart_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("smart_messages", JSON.stringify(messages));
  }, [messages]);

  // Handler: Change active skill template
  const handleSelectTemplate = (opt: typeof selectedOption) => {
    setSelectedOption(opt);
    const template = SKILL_TEMPLATES.find((t) => t.option === opt);
    if (template) {
      setInputPrompt(template.promptPlaceholder);
    } else {
      setInputPrompt("");
    }
  };

  // Handler: Add custom task card
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      completed: false,
      subtasks: [],
      completedSubtasks: [],
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setNewTaskDesc("");
  };

  // Handler: Toggle overall task completion
  const handleToggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Handler: Toggle subtask completion
  const handleToggleSubtask = (taskId: string, subtask: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const exists = t.completedSubtasks.includes(subtask);
        const nextCompleted = exists
          ? t.completedSubtasks.filter((s) => s !== subtask)
          : [...t.completedSubtasks, subtask];
        return {
          ...t,
          completedSubtasks: nextCompleted,
          // If all subtasks are finished, also check off overall completion as a smart indicator
          completed: nextCompleted.length === t.subtasks.length ? true : t.completed,
        };
      })
    );
  };

  // Handler: Delete task card
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Action: Refine Task with Gemini API
  const handleRefineTask = async (id: string) => {
    // Lock refining state to show loading spinner
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRefining: true } : t))
    );
    setErrorStatus(null);

    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    try {
      const response = await fetch("/api/gemini/refine-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetTask.title,
          description: targetTask.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refine task.");
      }

      const data = await response.json();

      // Update tasks state with refined subtasks and AI tip
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                description: data.refinedDescription || t.description,
                subtasks: data.subtasks || [],
                completedSubtasks: [],
                tip: data.tip || "",
                isRefining: false,
              }
            : t
        )
      );
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An error occurred refining the task.");
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isRefining: false } : t))
      );
    }
  };

  // Action: Direct conversation message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/gemini/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          option: selectedOption,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reach backend API.");
      }

      const data = await response.json();

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Could not generate AI content.");
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Reset Chat logs
  const handleResetChat = () => {
    setMessages([]);
    localStorage.removeItem("smart_messages");
  };

  // Stat calculation for current cards
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const workspaceProgressPercent = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Render correct Lucide icon for active layout selection
  const renderTemplateIcon = (opt: string) => {
    switch (opt) {
      case "brainstorm":
        return <Brain className="w-4 h-4 text-blue-400" />;
      case "explain":
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case "polish":
        return <FileText className="w-4 h-4 text-teal-400" />;
      case "action-plan":
        return <CheckSquare className="w-4 h-4 text-violet-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-200 relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sleek Top Navigation Banner */}
      <nav className="h-20 border-b border-slate-800/50 flex items-center justify-between px-6 md:px-12 relative z-20 backdrop-blur-sm bg-slate-950/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/30">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white italic font-display">AETHER.WORKSPACE</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
          <span className="text-blue-400">Live Agent Platform</span>
          <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
          <span>v4.0 Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 font-mono">Smart Grid Online</span>
          </div>
        </div>
      </nav>

      {/* Main Responsive Layout Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 z-10">
        
        {/* Workspace Brand Header */}
        <header id="workspace-header" className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-900/70 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <h1 className="font-bold text-3xl md:text-4xl tracking-tight text-white font-sans">
                Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-extrabold">Intelligence</span>
              </h1>
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Plan infrastructure tasks, simplify mechanics, polish text, and deconstruct multi-step cron plans with high-speed, server-side <span className="text-slate-200 font-semibold">Gemini-3.5-flash</span> models.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-4 bg-slate-900/45 border border-slate-800/80 p-4 rounded-3xl min-w-[220px]">
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1.5 font-bold tracking-wider">
                <span>OPTIMIZATION STAGE</span>
                <span className="text-blue-400 font-semibold">{workspaceProgressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-500" 
                  style={{ width: `${workspaceProgressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-white leading-none tracking-tighter">
                {completedTasksCount}
              </div>
              <div className="text-[9px] text-slate-500 font-mono font-bold mt-1 uppercase tracking-wider">
                OF {totalTasksCount} CARDS
              </div>
            </div>
          </div>
        </header>

        {/* Global Action Banner Info / Error Alert */}
        <AnimatePresence>
          {errorStatus && (
            <motion.div
              layout
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-4 rounded-2xl bg-rose-950/20 border border-rose-905/30 text-rose-300 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-200">Error Encountered</h4>
                <p className="text-xs text-rose-400 mt-1 leading-relaxed">{errorStatus}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dual Panel Layout Area */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* LEFT COLUMN: Brainstorming templates and Chat Console (7cols) */}
          <section className="lg:col-span-7 flex flex-col gap-6 min-h-[500px]">
            
            {/* Template Skill Selector */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                Choose AI Smart Skill
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SKILL_TEMPLATES.map((item) => {
                  const isActive = selectedOption === item.option;
                  return (
                    <button
                      id={`template-btn-${item.id}`}
                      key={item.id}
                      onClick={() => handleSelectTemplate(item.option)}
                      className={`flex flex-col items-start text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-blue-500/80 shadow-xl shadow-blue-950/30"
                          : "bg-slate-900/20 border-slate-800/50 hover:border-slate-700/60 hover:bg-slate-900/40"
                      }`}
                    >
                      <span className="mb-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/30">
                        {renderTemplateIcon(item.option)}
                      </span>
                      <strong className="text-xs font-semibold text-slate-200 block truncate w-full">
                        {item.title}
                      </strong>
                      <span className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Output Console */}
            <div className="flex-1 min-h-0">
              <SmartOutput
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                inputPrompt={inputPrompt}
                setInputPrompt={setInputPrompt}
                selectedOption={selectedOption}
              />
            </div>

            {/* Reset Chat History */}
            {messages.length > 0 && (
              <div className="flex justify-end">
                <button
                  id="reset-chat-btn"
                  onClick={handleResetChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs text-slate-500 hover:text-slate-350 transition-colors cursor-pointer font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>CLEAR CONSOLE LOGS</span>
                </button>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Tasks Cards & Goal Tracker Panel (5cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Quick-Add Card Dock */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-semibold text-sm tracking-tight text-white mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Create Workspace Card</span>
              </h3>
              <form onSubmit={handleAddTask} className="space-y-3 relative z-10">
                <input
                  id="new-task-title-input"
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="E.g., Prepare system launch parameters..."
                  className="w-full bg-slate-950 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 border border-slate-800/80 focus:outline-none focus:border-blue-500/80"
                />
                <textarea
                  id="new-task-desc-textarea"
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Optionally add target parameters here. Refine it with AI."
                  className="w-full bg-slate-950 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 border border-slate-800/80 focus:outline-none focus:border-blue-500/80 resize-none"
                />
                <button
                  id="create-task-btn"
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Add Tracker Card</span>
                </button>
              </form>
            </div>

            {/* Task Card Grid List */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                ACTIVE CARDS & CHECKLISTS
              </span>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[550px] scrollbar-thin">
                <AnimatePresence initial={false}>
                  {tasks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-8 border border-dashed border-slate-800/80 rounded-3xl bg-slate-900/10"
                    >
                      <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">No tasks logged.</p>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                        Add a simple focus target above, then use the smart breakdown button to instantly plan execution pathways.
                      </p>
                    </motion.div>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleTaskComplete}
                        onToggleSubtask={handleToggleSubtask}
                        onDelete={handleDeleteTask}
                        onRefine={handleRefineTask}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer / Info Helper */}
            <div className="p-4 bg-slate-900/20 border border-slate-800/40 rounded-2xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Refining any workspace card calls a structured LLM pipeline that designs structured executable checklists and returns customized contextual guidance directly to the card.
              </p>
            </div>
          </section>

        </main>

        {/* Footer links */}
        <footer className="mt-8 h-16 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] relative z-10">
          <div className="flex gap-6">
            <span>Status: <span className="text-emerald-500 font-semibold">Operational</span></span>
            <span>Security: SOC2 / ISO 27001</span>
          </div>
          <div className="flex gap-6 mt-2 sm:mt-0">
            <span className="text-slate-300">© 2026 Aether Workspace</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
