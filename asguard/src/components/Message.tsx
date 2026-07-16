'use client'

import { Bot, User, Loader2 } from 'lucide-react'

export interface MessageType {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: any[]
  executionTimeMs?: number
  isError?: boolean
  explanation?: string
  isGenerating?: boolean
}

interface MessageProps {
  message: MessageType
  isGenerating?: boolean
}

/**
 * Parses inline markdown: bold (**text**) and inline code (`code`)
 */
function parseInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400 font-mono text-[12px] px-1.5 py-0.5 rounded ring-1 ring-slate-200/50 dark:ring-slate-700/50">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

/**
 * Parses block markdown: headings (#, ##, ###), lists (*, -), and regular paragraphs
 */
function renderMarkdown(text: string) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-[14px] font-extrabold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      )
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-[16px] font-extrabold text-slate-900 dark:text-white mt-5 mb-2.5">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      )
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-[18px] font-black text-slate-900 dark:text-white mt-6 mb-3">
          {parseInlineMarkdown(trimmed.slice(2))}
        </h1>
      )
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      return (
        <li key={idx} className="ml-5 list-disc text-[14px] md:text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>
      )
    }
    if (trimmed === '') {
      return <div key={idx} className="h-3" />
    }
    
    return (
      <p key={idx} className="text-[14px] md:text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-300 mb-2">
        {parseInlineMarkdown(line)}
      </p>
    )
  })
}

export default function Message({ message, isGenerating }: MessageProps) {
  const isAi = message.role === 'assistant'
  const isMsgGenerating = isGenerating || message.isGenerating
  
  return (
    <div className={`flex flex-col gap-3 w-full max-w-4xl ${isAi ? 'self-start' : 'self-end items-end animate-fade-in'}`}>
      {/* Sender Header */}
      <div className={`flex items-center gap-2.5 ${isAi ? 'ml-1' : 'mr-1'}`}>
        {isAi ? (
          <>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center shadow-md ai-glow">
              <Bot size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-extrabold text-[#1428A0] dark:text-[#2189FF] tracking-wide uppercase">
              ASGUARD AI
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              You
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <User size={14} />
            </div>
          </>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`w-full ${isAi ? '' : 'max-w-[80%]'}`}>
        <div 
          className={`rounded-3xl p-6 md:p-8 shadow-sm transition-all ${
            isAi 
              ? message.isError 
                ? 'bg-red-50/75 dark:bg-red-950/20 ring-1 ring-red-100 dark:ring-red-900/30' 
                : 'bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-[0_10px_35px_rgba(20,40,160,0.03)] dark:shadow-none'
              : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tr-[8px] ring-1 ring-slate-200/50 dark:ring-slate-700/30'
          }`}
        >
          {isMsgGenerating ? (
            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 py-1">
              <Loader2 size={18} className="animate-spin text-[#1428A0] dark:text-[#2189FF]" />
              <span className="text-sm font-semibold animate-pulse">Running tools & analyzing database...</span>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {renderMarkdown(message.content)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
