'use client'

import { useState } from 'react'
import { Megaphone, Send, Loader2 } from 'lucide-react'

export function BroadcastManager({ campaignId }: { campaignId: string }) {
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('info')
  const [expiresHours, setExpiresHours] = useState(24)
  const [sending, setSending] = useState(false)
  const [successStatus, setSuccessStatus] = useState<string | null>(null)
  
  async function sendBroadcast() {
    setSending(true)
    setSuccessStatus(null)
    
    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          message,
          severity,
          expires_hours: expiresHours
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage('')
        setSuccessStatus('Broadcast deployed successfully!')
        setTimeout(() => setSuccessStatus(null), 5000)
      } else {
        alert(`Failed to broadcast: ${result.message}`)
      }
    } catch (e) {
      alert('An error occurred during deployment.')
    } finally {
      setSending(false)
    }
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Live Broadcast Engine</h3>
            <p className="text-xs text-slate-500">Push real-time updates directly to active students</p>
          </div>
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Instant Delivery Active
        </span>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="info">📢 Info</option>
          <option value="warning">⚠️ Warning</option>
          <option value="success">✅ Success</option>
          <option value="deadline">⏰ Deadline</option>
        </select>
        
        <select
          value={expiresHours}
          onChange={(e) => setExpiresHours(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value={1}>1 Hour TTL</option>
          <option value={6}>6 Hours TTL</option>
          <option value={12}>12 Hours TTL</option>
          <option value={24}>24 Hours TTL</option>
          <option value={72}>72 Hours TTL</option>
        </select>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Deadline extended to Friday at 11:59 PM"
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
        />
        
        <button
          onClick={sendBroadcast}
          disabled={!message || sending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-w-[120px]"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Deploying...' : 'Deploy'}
        </button>
      </div>
      
      {successStatus && (
        <p className="text-xs font-semibold text-emerald-600 mt-3 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</span>
          {successStatus}
        </p>
      )}
    </div>
  )
}
