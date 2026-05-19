'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

export function SystemStatus() {
  const [status, setStatus] = useState<'operational' | 'degraded' | 'offline'>('operational')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          setStatus('operational')
        } else {
          setStatus('degraded')
        }
      } catch {
        setStatus('offline')
      }
      setLastSync(new Date())
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    operational: { icon: CheckCircle2, text: 'System Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    degraded: { icon: AlertTriangle, text: 'System Degraded', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    offline: { icon: AlertCircle, text: 'System Offline', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
  }
  
  const Config = statusConfig[status]
  const Icon = Config.icon
  
  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${Config.bg} backdrop-blur-md shadow-inner text-xs transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${Config.color}`} />
          <span className={`font-semibold tracking-wide uppercase text-[10px] ${Config.color}`}>
            {Config.text}
          </span>
        </div>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status === 'operational' ? '#34d399' : status === 'degraded' ? '#fbbf24' : '#f87171' }}></span>
      </div>
      
      {lastSync && (
        <span className="text-[10px] text-slate-400 font-mono">
          Last sync: {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
