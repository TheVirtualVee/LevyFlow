'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Send, Pause, Play, Trash2, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BroadcastMessage {
  id: string
  message: string
  severity: 'info' | 'warning' | 'success' | 'deadline'
  active: boolean
  ends_at: string
  created_at: string
}

export function BroadcastManager({ campaignId }: { campaignId?: string }) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [severity, setSeverity] = useState('info')
  const [duration, setDuration] = useState(24)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
    
    const channel = supabase
      .channel('broadcasts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'broadcast_messages' },
        () => fetchMessages()
      )
      .subscribe()
    
    return () => { channel.unsubscribe() }
  }, [campaignId])

  async function fetchMessages() {
    let query = supabase
      .from('broadcast_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    
    const { data } = await query
    if (data) setMessages(data)
  }

  async function sendBroadcast() {
    if (!newMessage.trim()) return
    
    setSending(true)
    await fetch('/api/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        campaign_id: campaignId || null,
        message: newMessage,
        severity,
        ends_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
      })
    })
    setNewMessage('')
    setSending(false)
    fetchMessages()
  }

  async function toggleActive(message: BroadcastMessage) {
    await fetch(`/api/broadcasts/${message.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: !message.active })
    })
    fetchMessages()
  }

  async function deleteMessage(id: string) {
    if (confirm('Delete this broadcast message?')) {
      await fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
      fetchMessages()
    }
  }

  const severityColors = {
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    deadline: 'bg-red-100 text-red-700 border-red-200 animate-pulse'
  }

  const severityIcons = {
    info: '📢',
    warning: '⚠️',
    success: '✅',
    deadline: '⏰'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Live Broadcast</h3>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
            Reaches students instantly
          </span>
        </div>
        <p className="text-xs text-white/80 mt-1">
          Messages scroll across all student payment pages
        </p>
      </div>
      
      {/* Create New Broadcast */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2 mb-3">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
          >
            <option value="info">📢 Info</option>
            <option value="warning">⚠️ Warning</option>
            <option value="success">✅ Success</option>
            <option value="deadline">⏰ Deadline</option>
          </select>
          
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
          >
            <option value={1}>1 hour</option>
            <option value={6}>6 hours</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="e.g., Deadline extended to Friday at 11:59 PM"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
            onKeyPress={(e) => e.key === 'Enter' && sendBroadcast()}
          />
          <button
            onClick={sendBroadcast}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
      
      {/* Active Broadcasts Queue */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Active Broadcasts Queue
          </h4>
          <span className="text-xs text-gray-500">
            {messages.filter(m => m.active).length} active
          </span>
        </div>
        
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No broadcasts yet. Create your first message above.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  msg.active ? severityColors[msg.severity] : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{severityIcons[msg.severity]}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      msg.active ? 'bg-white/50' : 'bg-gray-200'
                    }`}>
                      {msg.severity.toUpperCase()}
                    </span>
                    {msg.active && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${msg.active ? 'font-medium text-slate-800' : 'text-gray-500'}`}>
                    {msg.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                    {msg.ends_at && (
                      <> • Expires: {new Date(msg.ends_at).toLocaleString()}</>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => toggleActive(msg)}
                    className={`p-1.5 rounded transition-colors ${
                      msg.active 
                        ? 'hover:bg-yellow-200 text-yellow-700' 
                        : 'hover:bg-green-200 text-green-700'
                    }`}
                    title={msg.active ? 'Pause Broadcast' : 'Resume Broadcast'}
                  >
                    {msg.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                    title="Delete Broadcast"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Preview Section */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Preview (scrolling banner)</p>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg py-2 px-3 overflow-hidden">
          <div className="flex gap-6 animate-marquee whitespace-nowrap">
            {messages.filter(m => m.active).slice(0, 5).map(msg => (
              <span key={msg.id} className="text-white text-sm inline-flex items-center gap-2">
                <span>{severityIcons[msg.severity]}</span>
                {msg.message}
              </span>
            ))}
            {messages.filter(m => m.active).length === 0 && (
              <span className="text-white/70 text-sm">No active broadcasts</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
