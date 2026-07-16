'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Database, Clock, Code, Table, Info } from 'lucide-react'

interface SQLPanelProps {
  sql: string
  executionTimeMs: number
  data?: any[] | null
  explanation?: string | null
}

export default function SQLPanel({ sql, executionTimeMs, data = [], explanation }: SQLPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'sql' | 'explanation' | 'data'>('sql')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Ensure data is treated as an array even if passed as null
  const safeData = data || []
  const rowCount = safeData.length

  return (
    <div className="w-full bg-[#182235] text-slate-100 rounded-2xl ring-1 ring-slate-800/80 shadow-lg overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Database size={16} />
          </div>
          <div>
            <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              Generated SQL & Data
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-500" />
                {executionTimeMs} ms
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{rowCount} {rowCount === 1 ? 'row' : 'rows'} returned</span>
            </div>
          </div>
        </div>

        <button className="w-8 h-8 rounded-lg hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-800">
          {/* Tabs header */}
          <div className="flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900/40">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('sql')}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'sql' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code size={13} />
                SQL Query
              </button>
              
              {explanation && (
                <button 
                  onClick={() => setActiveTab('explanation')}
                  className={`py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'explanation' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info size={13} />
                  Explanation
                </button>
              )}

              {rowCount > 0 && (
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'data' 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table size={13} />
                  Result Set
                </button>
              )}
            </div>

            {activeTab === 'sql' && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tab Panels */}
          <div className="p-5 leading-relaxed max-h-[320px] overflow-y-auto chat-scroll bg-slate-950/30">
            {activeTab === 'sql' ? (
              <pre className="font-mono text-[13px] text-blue-200 whitespace-pre-wrap select-all">{sql}</pre>
            ) : activeTab === 'explanation' ? (
              <div className="text-[13px] text-slate-350 font-medium py-1.5 px-2 select-text">
                <span className="text-blue-400 font-semibold block mb-1 flex items-center gap-1.5">
                  <Info size={12} /> Query Purpose
                </span>
                <p className="text-slate-300 leading-relaxed text-[13.5px] italic">
                  "{explanation}"
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full font-mono text-[13px]">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      {Object.keys(safeData[0] || {}).map((key) => (
                        <th key={key} className="py-2.5 px-3 bg-slate-900/20">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {safeData.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-slate-900/60 hover:bg-slate-800/20 transition-colors"
                      >
                        {Object.values(row || {}).map((val: any, cellIdx) => {
                          let displayVal = String(val);
                          if (val === null) displayVal = 'NULL';
                          else if (typeof val === 'boolean') displayVal = val ? 'TRUE' : 'FALSE';
                          else if (typeof val === 'object') displayVal = JSON.stringify(val);
                          
                          return (
                            <td key={cellIdx} className="py-2.5 px-3 font-medium whitespace-nowrap">
                              <span className={
                                val === null ? 'text-slate-600 italic' :
                                typeof val === 'number' ? 'text-amber-400' :
                                typeof val === 'boolean' ? 'text-purple-400' : 'text-slate-200'
                              }>
                                {displayVal}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
