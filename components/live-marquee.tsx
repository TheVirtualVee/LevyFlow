'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LiveMarquee({ campaignId }: { campaignId?: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    // INITIAL FETCH - Keeps database awake on page load
    fetchMessages()
    
    // REAL-TIME SUBSCRIPTION - Continuous activity
    const channel = supabase
      .channel('broadcasts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_messages'
        },
        (payload) => {
          console.log('Live update received, refreshing broadcasts.')
          fetchMessages() // Refresh immediately
        }
      )
      .subscribe()
    
    // KEEP-ALIVE PING - Every 60 seconds, prevents idle timeout
    const keepAliveInterval = setInterval(() => {
      fetchMessages() // Silent database read to prevent free-tier cold starts
    }, 60000) // 60 seconds
    
    return () => {
      supabase.removeChannel(channel)
      clearInterval(keepAliveInterval)
    }
  }, [campaignId])

  async function fetchMessages() {
    let query = (supabase
      .from('broadcast_messages' as any) as any)
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (campaignId) {
      // Fetch global messages OR messages specific to this campaign
      query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
    } else {
      // Fetch only global messages
      query = query.is('campaign_id', null)
    }
    
    const { data } = await query
    if (data) setMessages(data)
  }

  if (messages.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 overflow-hidden w-full relative z-50 shadow-md">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}} />
      <div className="whitespace-nowrap w-full overflow-hidden">
        <div className="animate-marquee text-sm font-semibold tracking-wide flex items-center">
          {messages.map((msg, idx) => (
            <span key={msg.id} className="inline-flex items-center mx-12">
              {msg.severity === 'warning' && <span className="mr-2 text-amber-300">⚠️</span>}
              {msg.severity === 'deadline' && <span className="mr-2 text-rose-300">⏰</span>}
              {msg.severity === 'success' && <span className="mr-2 text-emerald-300">✅</span>}
              {msg.severity === 'info' && <span className="mr-2 text-blue-200">📢</span>}
              <span>{msg.message}</span>
            </span>
          ))}
          {/* Duplicate for seamless loop if there's only a few messages */}
          {messages.length < 5 && messages.map((msg, idx) => (
            <span key={`dup-${msg.id}`} className="inline-flex items-center mx-12">
              {msg.severity === 'warning' && <span className="mr-2 text-amber-300">⚠️</span>}
              {msg.severity === 'deadline' && <span className="mr-2 text-rose-300">⏰</span>}
              {msg.severity === 'success' && <span className="mr-2 text-emerald-300">✅</span>}
              {msg.severity === 'info' && <span className="mr-2 text-blue-200">📢</span>}
              <span>{msg.message}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
