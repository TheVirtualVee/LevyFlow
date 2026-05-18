'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FolderPlus, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react'
import Link from 'next/link'

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) return

      const { data: profileData } = await (supabase
        .from('user_profiles') as any)
        .select('school_id')
        .eq('id', user.id)
        .single()

      const profile = profileData as any

      if (!profile?.school_id) return

      const { data: list, error: listErr } = await (supabase
        .from('campaigns') as any)
        .select('*, host:host_id(full_name)')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

      if (listErr) throw listErr
      setCampaigns(list || [])
    } catch (e) {
      console.error('Failed to fetch campaigns list:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Loading Campaigns Ledger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Payment Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">Manage active, closed, and draft levy collection campaigns for your institution.</p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 py-2 px-4 shadow-sm transition-all">
            <FolderPlus className="w-4.5 h-4.5" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaigns Listing */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-6">
          <Inbox className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Campaigns Yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
            Create your first levy payment campaign. Students will be able to submit transfer screenshot proof to be automatically reconciled.
          </p>
          <Link href="/campaigns/new" className="inline-block mt-5">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isEnded = new Date(c.ends_at) < new Date()
            return (
              <Card key={c.id} className="group relative bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isEnded ? 'bg-slate-100 text-slate-650 border border-slate-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isEnded ? 'Ended' : 'Active'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ₦{c.amount.toLocaleString()} Required
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-650 transition-colors mt-2 leading-tight">
                    {c.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-slate-500 leading-relaxed mt-1">
                    {c.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex-grow flex flex-col justify-end">
                  <div className="border-t border-slate-100 pt-3 mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-550 font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.bank_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{new Date(c.ends_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/campaigns/${c.id}`} className="block mt-4">
                    <Button className="w-full bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-blue-600 transition-all font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5">
                      Open Control Panel <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
