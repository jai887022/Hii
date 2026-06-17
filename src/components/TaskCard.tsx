import { useState } from "react";
import { Task } from "../types";
import { CheckSquare, Square, Trash2, Zap, Lightbulb, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtask: string) => void;
  onDelete: (id: string) => void;
  onRefine: (id: string) => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onToggleSubtask,
  onDelete,
  onRefine,
}: TaskCardProps) {
  const [showTip, setShowTip] = useState(true);

  const totalSubtasks = task.subtasks.length;
  const completedSubtasksCount = task.completedSubtasks.length;
  const percentComplete = totalSubtasks > 0 
    ? Math.round((completedSubtasksCount / totalSubtasks) * 100) 
    : (task.completed ? 100 : 0);

  return (
    <motion.div
      id={`task-card-${task.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`p-5 rounded-3xl border transition-all duration-300 ${
        task.completed
          ? "bg-slate-900/30 border-slate-800/60 opacity-60"
          : "bg-slate-900/60 border-slate-800/80 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            id={`toggle-task-btn-${task.id}`}
            onClick={() => onToggleComplete(task.id)}
            className="mt-1 text-slate-400 hover:text-blue-400 transition-colors shrink-0 outline-none cursor-pointer"
          >
            {task.completed ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <h4
              id={`task-title-${task.id}`}
              className={`font-semibold text-sm tracking-tight transition-all duration-300 ${
                task.completed ? "line-through text-slate-500 font-normal" : "text-slate-100"
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p
                id={`task-desc-${task.id}`}
                className="text-xs text-slate-400 mt-1 leading-relaxed break-words"
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!task.completed && (
            <button
              id={`refine-task-btn-${task.id}`}
              onClick={() => onRefine(task.id)}
              disabled={task.isRefining}
              title="Break down and refine with Gemini AI"
              className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {task.isRefining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            id={`delete-task-btn-${task.id}`}
            onClick={() => onDelete(task.id)}
            title="Delete item"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtasks Checklist */}
      {totalSubtasks > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/40">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-2">
            <span className="tracking-wider">ACTION PLAN CHECKLIST</span>
            <span className="text-slate-400 font-semibold">{completedSubtasksCount}/{totalSubtasks} ({percentComplete}%)</span>
          </div>

          <div className="space-y-2">
            {task.subtasks.map((sub, index) => {
              const isSubChecked = task.completedSubtasks.includes(sub);
              return (
                <button
                  id={`subtask-btn-${task.id}-${index}`}
                  key={index}
                  onClick={() => onToggleSubtask(task.id, sub)}
                  className="flex items-center gap-2 w-full text-left py-1 text-xs text-slate-300 hover:text-slate-100 transition-colors group cursor-pointer outline-none"
                >
                  <span className="shrink-0 text-slate-500 group-hover:text-blue-400 transition-colors">
                    {isSubChecked ? (
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <span className="block w-3 h-3 rounded-md border border-slate-700 group-hover:border-blue-500" />
                    )}
                  </span>
                  <span className={`break-words ${isSubChecked ? "line-through text-slate-500" : ""}`}>
                    {sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
            <motion.div
              layoutId={`progress-bar-${task.id}`}
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Smart Tip */}
      <AnimatePresence>
        {task.tip && showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider text-blue-400 font-mono mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>AI Productivity Tip</span>
              </div>
              <p className="leading-relaxed text-slate-300">{task.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
