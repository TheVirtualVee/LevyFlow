'use client'

import { useEffect, useState } from 'react'
import { Activity, Database, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SupabaseHealthMonitor() {
  const [lastPing, setLastPing] = useState<Date | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    // Monitor keep-alive effectiveness
    const checkLatency = async () => {
      const start = Date.now()
      // Perform a lightweight query just to measure cold start vs warm query
      await (supabase.from('broadcast_messages' as any) as any).select('id').limit(1)
      const duration = Date.now() - start
      setResponseTime(duration)
      setLastPing(new Date())
    }
    
    checkLatency()
    const interval = setInterval(checkLatency, 60000)
    return () => clearInterval(interval)
  }, [supabase])
  
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 w-full shadow-inner">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-500" />
        <span className="font-semibold text-slate-300">Supabase Engine:</span>
        {responseTime !== null ? (
          <span className={`font-mono font-bold ${responseTime < 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {responseTime < 200 ? '✓ WARM' : '⏳ WARMING'} ({responseTime}ms)
          </span>
        ) : (
          <span className="text-slate-500 font-mono">Pinging...</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" />
        <span className="font-medium text-slate-300">Last heartbeat:</span>
        <span className="font-mono">{lastPing?.toLocaleTimeString() || '--:--:--'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="font-medium text-slate-300">Keep-alive cycle:</span>
        <span className="font-mono text-emerald-400">60s ACTIVE</span>
      </div>
    </div>
  )
}
