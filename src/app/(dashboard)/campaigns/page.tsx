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
import { BroadcastManager } from '@/components/BroadcastManager'

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [parentLecturer, setParentLecturer] = useState<any>(null)
  const [stats, setStats] = useState({ expected: 0, collected: 0, paidCount: 0, pendingCount: 0 })
  const [activeBroadcastId, setActiveBroadcastId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) return

      const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) return
      setUserProfile(profile)

      if (profile.role === 'course_rep' && profile.parent_id) {
        const { data: parent } = await (supabase
          .from('user_profiles') as any)
          .select('full_name, email')
          .eq('id', profile.parent_id)
          .maybeSingle()
        if (parent) setParentLecturer(parent)
      }

      let query = supabase.from('campaigns').select('*, host:host_id(full_name)')
      if (profile.role === 'course_rep') {
        query = query.or(`manager_id.eq.${user.id},host_id.eq.${user.id}`)
      } else {
        query = query.eq('host_id', user.id)
      }

      const { data: list, error: listErr } = await (query as any).order('created_at', { ascending: false })
      if (listErr) throw listErr
      
      const campaignList = list || []
      setCampaigns(campaignList)

      if (campaignList.length > 0) {
        const campIds = campaignList.map((c: any) => c.id)
        const { data: sessList } = await (supabase
          .from('payment_sessions') as any)
          .select('id, campaign_id, screenshot_url')
          .in('campaign_id', campIds)

        if (sessList) {
          let expectedVal = 0
          let collectedVal = 0
          let paid = 0
          let pending = 0

          campaignList.forEach((c: any) => {
            const campSessions = sessList.filter((s: any) => s.campaign_id === c.id)
            expectedVal += Number(c.amount) * (campSessions.length || 0)
            
            const paidSess = campSessions.filter((s: any) => s.screenshot_url)
            collectedVal += Number(c.amount) * paidSess.length
            paid += paidSess.length
            pending += campSessions.length - paidSess.length
          })

          setStats({
            expected: expectedVal,
            collected: collectedVal,
            paidCount: paid,
            pendingCount: pending
          })
        }
      }
    } catch (e) {
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

  const isRep = userProfile?.role === 'course_rep'
  const isLecturer = userProfile?.role === 'host'
  const isFaculty = userProfile?.role === 'school_admin'

  return (
    <div className="space-y-8">
      {/* Dynamic Role-Based Top Banner */}
      {isRep && (
        <div className="bg-gradient-to-r from-blue-900/10 to-slate-900 border border-blue-800/20 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-black text-white">Welcome, {userProfile?.full_name} ({userProfile?.course_code || 'ECO 301'} Representative)</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            You are delegated to manage course Collections for {parentLecturer ? `Dr. ${parentLecturer.full_name}` : 'your supervising Lecturer'}. 
            All student remittance transfers are routed directly to the lecturer&apos;s specified GTBank, OPay, or Moniepoint bank accounts.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            ⚡ Direct Lecturer Remittance • No Middleman Dues
          </div>
        </div>
      )}

      {isLecturer && (
        <div className="bg-gradient-to-r from-emerald-900/10 to-slate-900 border border-emerald-800/20 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-black text-white">Lecturer Command Center • Dr. {userProfile?.full_name}</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Create course handout collections and delegate registration verification tasks to course reps. Student bank transfers land directly in your bank account, maintaining zero platform liability.
          </p>
        </div>
      )}

      {isFaculty && (
        <div className="bg-gradient-to-r from-indigo-900/10 to-slate-900 border border-indigo-800/20 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-black text-white">Faculty Administration Panel • Dues & Levies</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Departmental oversight panel. Easily track expected revenues, verify active collections, and download audit-ready Excel reports for all courses.
          </p>
        </div>
      )}

      {/* Main Stats Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expected Revenue</p>
          <p className="text-2xl font-black text-slate-950 mt-1">₦{stats.expected.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Across all assigned courses</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Dues</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₦{stats.collected.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {stats.expected > 0 ? `${Math.round((stats.collected / stats.expected) * 100)}%` : '0%'} of expected
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students Verification Proofs</p>
          <p className="text-2xl font-black text-slate-905 mt-1">{stats.paidCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Uploaded screenshots</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expectant List Registered</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting payment upload</p>
        </div>
      </div>

      {/* Global Broadcast Section */}
      <div className="no-print">
        <BroadcastManager />
      </div>

      {/* Title & Creation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            {isRep ? 'My Managed Collections' : 'Active Levies & Handout Campaigns'}
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            {isRep ? 'Verify student receipts and tokens for assigned courses.' : 'View current active, ended, or draft payment portals.'}
          </p>
        </div>
        {!isRep && (
          <Link href="/campaigns/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 py-2 px-4 shadow-sm transition-all text-xs">
              <FolderPlus className="w-4 h-4" /> New Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Campaigns Listing */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-6">
          <Inbox className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Campaigns Yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
            Create your first levy payment campaign. Students will be able to submit transfer screenshot proof to be automatically reconciled.
          </p>
          {!isRep && (
            <Link href="/campaigns/new" className="inline-block mt-5">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 shadow-sm text-xs">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isEnded = new Date(c.ends_at) < new Date()
            return (
              <Card key={c.id} className="group relative bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden text-left">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isEnded ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isEnded ? 'Ended' : 'Active'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ₦{Number(c.amount).toLocaleString()} Required
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-2 leading-tight">
                    {c.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-[11px] text-slate-500 leading-relaxed mt-1">
                    {c.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex-grow flex flex-col justify-end">
                  <div className="border-t border-slate-100 pt-3 mt-3 grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-bold uppercase">
                    <div className="flex items-center gap-1.5 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.bank_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{new Date(c.ends_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/campaigns/${c.id}`} className="flex-1">
                      <Button className="w-full bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-blue-600 transition-all font-bold py-2 rounded text-[11px] flex items-center justify-center gap-1.5">
                        Control Panel <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveBroadcastId(activeBroadcastId === c.id ? null : c.id)
                      }}
                      className={`px-3 border text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
                        activeBroadcastId === c.id
                          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      📢 Broadcast
                    </button>
                  </div>
                  {activeBroadcastId === c.id && (
                    <div className="border-t border-slate-100 pt-4 mt-4 no-print w-full">
                      <BroadcastManager campaignId={c.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
