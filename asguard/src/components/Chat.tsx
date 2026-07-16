'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, MessageSquare, Trash2, Moon, Sun, Database, Loader2, Globe } from 'lucide-react'
import Message, { MessageType } from './Message'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { currentUser } = useAuth()
  
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your ASGUARD Database Assistant. I can read your Prisma schema, safely execute read-only SQL queries, and answer telemetry questions. \n\nWhat would you like to know about your smart home energy usage?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('English')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    "List all available tables",
    "Which room consumed the highest energy?",
    "Show the average ambient temperature today",
    "Show today's active simulations",
    "List the 5 most power-consuming appliances"
  ]

  const languages = [
    { code: 'English', label: '🇬🇧 English' },
    { code: 'Spanish', label: '🇪🇸 Español' },
    { code: 'Hindi', label: '🇮🇳 हिन्दी' },
    { code: 'French', label: '🇫🇷 Français' },
    { code: 'German', label: '🇩🇪 Deutsch' },
    { code: 'Tamil', label: '🇮🇳 தமிழ்' },
    { code: 'Telugu', label: '🇮🇳 తెలుగు' }
  ]

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Simple local storage persistence for dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('asguard-assistant-theme')
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = !darkMode
    setDarkMode(nextTheme)
    localStorage.setItem('asguard-assistant-theme', nextTheme ? 'dark' : 'light')
  }

  const clearChat = () => {
    if (confirm('Are you sure you want to clear your conversation history?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I am your ASGUARD Database Assistant. I can read your Prisma schema, safely execute read-only SQL queries, and answer telemetry questions. \n\nWhat would you like to know about your smart home energy usage?'
        }
      ])
    }
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: MessageType = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // User context to scope queries (filtering by current user's profile house/owner if available)
    const context = {
      ownerId: currentUser?.uid || 'HOUSE001',
      houseId: 'HOUSE001' // default house in database schema
    }

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context,
          language: selectedLanguage
        })
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || result.answer || 'Failed to get response')
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response reader
        const reader = response.body?.getReader()
        if (!reader) throw new Error('Response stream reader is not available.')

        const decoder = new TextDecoder()
        let accumulatedText = ''
        const aiMessageId = `msg-${Date.now()}-ai`
        
        // Add a placeholder message in generating state
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            role: 'assistant',
            content: '',
            isGenerating: true
          }
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Check if metadata is split
          if (accumulatedText.includes('__METADATA__')) {
            const parts = accumulatedText.split('__METADATA__\n')
            const nlResponse = parts[0].trim()
            const metadataStr = parts[1]?.trim() || ''

            try {
              const metadata = JSON.parse(metadataStr)
              setMessages((prev) => 
                prev.map((m) => 
                  m.id === aiMessageId 
                    ? {
                        ...m,
                        content: nlResponse,
                        sql: metadata.sql,
                        data: metadata.data,
                        executionTimeMs: metadata.executionTime ? parseInt(metadata.executionTime) : 0,
                        isGenerating: false
                      }
                    : m
                )
              )
            } catch (err) {
              setMessages((prev) => 
                prev.map((m) => 
                  m.id === aiMessageId 
                    ? { ...m, content: nlResponse }
                    : m
                )
              )
            }
          } else {
            setMessages((prev) => 
              prev.map((m) => 
                m.id === aiMessageId 
                  ? { ...m, content: accumulatedText }
                  : m
              )
            )
          }
        }

        // Finalize generating state
        setMessages((prev) => 
          prev.map((m) => 
            m.id === aiMessageId 
              ? { ...m, isGenerating: false }
              : m
          )
        )

      } else {
        // Handle non-stream fallback (e.g. error JSON payloads)
        const result = await response.json()
        const aiMessage: MessageType = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: result.answer || 'No response returned.',
          sql: result.sql,
          data: result.data,
          executionTimeMs: result.executionTime ? parseInt(result.executionTime) : 0,
          isError: !result.success
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      const errorMessage: MessageType = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your request: **${err.message}**.`,
        isError: true
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 px-6 lg:px-10 pb-8 min-h-0 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      
      {/* LEFT PANEL: Suggested Questions & Database Schema Metadata */}
      <div className="w-full lg:w-[260px] flex flex-col shrink-0 gap-6 z-20">
        
        {/* Suggested Questions */}
        <div className="bg-white dark:bg-slate-900/50 p-5 rounded-[24px] premium-shadow border border-slate-100 dark:border-slate-800/80">
          <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-4 ml-1 flex items-center gap-2">
            <MessageSquare size={13} />
            Quick Queries
          </h3>
          <div className="flex flex-col gap-2.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="w-full text-left bg-slate-50 dark:bg-slate-850/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-[14px] p-3 border border-slate-100 dark:border-slate-800/50 hover:border-blue-200/50 dark:hover:border-blue-900/30 transition-all duration-300 group flex items-start gap-2.5 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                <Sparkles size={13} className="text-blue-500 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug">
                  {q}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Database Quick Info */}
        <div className="bg-gradient-to-br from-[#1428A0]/5 to-[#2189FF]/5 dark:from-slate-900/30 dark:to-slate-900/10 p-5 rounded-[24px] border border-blue-100/30 dark:border-slate-800/80">
          <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
            <Database size={13} className="text-blue-500" />
            Safety Shield Active
          </h4>
          <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-semibold mb-2">
            Only read-only <code className="text-blue-600 dark:text-blue-400 font-mono">SELECT</code> statements are processed.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'].map((cmd) => (
              <span key={cmd} className="text-[9px] font-black tracking-wider bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 px-2 py-0.5 rounded border border-red-100/50 dark:border-red-900/20">
                BLOCKED {cmd}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Main Chat Body */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 z-10 relative">
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] premium-shadow border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col min-h-0">
          
          {/* Chat Header controls */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                PostgreSQL Schema Context Enabled
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Globe size={13} className="text-slate-400 dark:text-slate-500" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent border-none text-[11.5px] font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-0 cursor-pointer pr-1"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-350">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme toggle */}
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all duration-300 hover:shadow-sm active:scale-95"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              
              {/* Clear History */}
              <button 
                onClick={clearChat}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition-all duration-300 hover:shadow-sm active:scale-95"
                title="Clear Chat History"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 chat-scroll flex flex-col gap-8 bg-slate-50/20 dark:bg-slate-950/5">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Area */}
          <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend(input)
              }}
              className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[20px] px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/10 transition-all duration-300 shadow-sm"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask me anything about your database logs..."
                className="flex-1 bg-transparent border-none text-[13.5px] font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-2 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  )
}
