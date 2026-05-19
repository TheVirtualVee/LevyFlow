'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BroadcastMessage {
  id: string
  campaign_id: string | null
  message: string
  severity: 'info' | 'warning' | 'success' | 'deadline'
  active: boolean
}

export function LiveMarquee({ campaignId }: { campaignId?: string }) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('broadcasts')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_messages'
        },
        (payload: any) => {
          fetchMessages()
        }
      )
      .subscribe()

    const pingInterval = setInterval(() => {
      fetchMessages()
    }, 60000)

    return () => {
      channel.unsubscribe()
      clearInterval(pingInterval)
    }
  }, [campaignId])

  async function fetchMessages() {
    try {
      let query = supabase
        .from('broadcast_messages')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (campaignId) {
        query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      }

      const { data } = await query
      if (data) {
        setMessages(data)
      }
    } catch (err) {
    }
  }

  if (messages.length === 0) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2 overflow-hidden w-full text-xs font-semibold select-none border-b border-white/10 z-50">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          animation: marquee 35s linear infinite;
          display: inline-block;
          will-change: transform;
        }
        .animate-marquee-loop:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="flex w-max">
        <div className="animate-marquee-loop whitespace-nowrap">
          {messages.map((msg) => (
            <span key={msg.id} className="inline-flex items-center mx-8">
              {msg.severity === 'warning' && '⚠️'}
              {msg.severity === 'deadline' && '⏰'}
              {msg.severity === 'success' && '✅'}
              {msg.severity === 'info' && '📢'}
              <span className="ml-2">{msg.message}</span>
            </span>
          ))}
        </div>
        
        {/* Duplicate for seamless looping visual effect */}
        <div className="animate-marquee-loop whitespace-nowrap" aria-hidden="true">
          {messages.map((msg) => (
            <span key={`dup-${msg.id}`} className="inline-flex items-center mx-8">
              {msg.severity === 'warning' && '⚠️'}
              {msg.severity === 'deadline' && '⏰'}
              {msg.severity === 'success' && '✅'}
              {msg.severity === 'info' && '📢'}
              <span className="ml-2">{msg.message}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
