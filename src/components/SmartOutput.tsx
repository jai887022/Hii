import { useState } from "react";
import { ChatMessage } from "../types";
import { Copy, Check, Bot, Sparkles, Send, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

interface SmartOutputProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  inputPrompt: string;
  setInputPrompt: (text: string) => void;
  selectedOption: string;
}

export default function SmartOutput({
  messages,
  isLoading,
  onSendMessage,
  inputPrompt,
  setInputPrompt,
  selectedOption,
}: SmartOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    onSendMessage(inputPrompt);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl relative backdrop-blur-sm">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <h2 className="font-semibold text-xs tracking-tight text-white flex items-center gap-1.5 font-sans uppercase">
            <Bot className="w-4 h-4 text-blue-400" />
            <span>AI Brainstorming & Analysis Console</span>
          </h2>
        </div>
        <div className="px-2 py-0.5 rounded bg-slate-800/80 text-[9px] text-slate-400 uppercase tracking-widest font-mono">
          Model: gemini-3.5-flash
        </div>
      </div>

      {/* Message Output Channel */}
      <div id="ai-output-channel" className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
        <AnimatePresence initial={false}>
          {!hasMessages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4"
            >
              <div className="p-4 bg-slate-800/40 rounded-full border border-slate-700/60 text-slate-400/80">
                <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <div className="max-w-md">
                <h3 className="font-semibold text-slate-200 text-sm">Interactive Knowledge Space</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Select a smart template from the options above or input any creative concept.
                  Gemini will analyze, explain, or generate an index for your productivity goals.
                </p>
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    msg.role === "user"
                      ? "bg-blue-950/40 border-blue-800/40 text-blue-400"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="text-[9px] uppercase font-bold font-mono">USR</span>
                  ) : (
                    <Bot className="w-4 h-4 text-blue-400" />
                  )}
                </div>

                {/* Bubble Container */}
                <div className={`relative max-w-[85%] group`}>
                  <div className="flex items-center justify-between mb-1 text-[9px] text-slate-500 font-mono">
                    <span className="uppercase">{msg.role === "user" ? "You" : "Gemini Analyst"}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-slate-900/85 border-slate-800 text-slate-200"
                        : "bg-slate-900 border-slate-800/60 text-slate-100"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    ) : (
                      <div className="markdown-body prose prose-invert prose-xs max-w-none text-slate-200 prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:text-slate-200">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>

                  {/* Bubble Actions */}
                  <div className="absolute right-3 top-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`copy-msg-btn-${msg.id}`}
                      onClick={() => handleCopy(msg.text, msg.id)}
                      title="Copy response to clipboard"
                      className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <motion.div
              id="ai-loading-bubble"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3.5 flex-row"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
                  Gemini thinking...
                </span>
                <div className="bg-slate-900 border border-slate-800/50 rounded-2xl px-4 py-3 min-w-[120px] flex gap-1 items-center justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Tray */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80">
        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
          <textarea
            id="chat-input-textarea"
            rows={1}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
            placeholder={
              selectedOption === "custom"
                ? "Enter or paste your query here... (Press Enter to submit)"
                : "Describe your custom details or just click send..."
            }
            className="flex-1 w-full bg-slate-950 text-sm text-slate-200 placeholder-slate-500 rounded-2xl pl-4 pr-12 py-3 border border-slate-800 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 resize-none transition-all scrollbar-none"
          />

          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-blue-600 shadow-md shadow-blue-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
          <span>Shift+Enter for newline</span>
          <span>Mode: {selectedOption.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
