'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CampaignStats } from '@/components/CampaignStats'
import { ReconciliationTable } from '@/components/ReconciliationTable'
import { BroadcastManager } from '@/components/BroadcastManager'
import { RegistrantManager } from '@/components/RegistrantManager'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Download, 
  Share2, 
  ExternalLink, 
  Calendar, 
  CreditCard,
  Clipboard,
  Check,
  Archive,
  ShieldCheck,
  Loader2,
  Printer,
  RefreshCw
} from 'lucide-react'

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'verified', 'third_party', 'disputed'
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch campaign details
      const { data: camp, error: campErr } = await supabase
        .from('campaigns')
        .select('*, school:school_id(*)')
        .eq('id', params.id)
        .single()

      if (campErr) throw campErr
      setCampaign(camp)

      // 2. Fetch payment sessions
      const { data: sess, error: sessErr } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('campaign_id', params.id)
        .order('student_name', { ascending: true })

      if (sessErr) throw sessErr

      // 3. Fetch status view records
      const { data: statusesData, error: statErr } = await supabase
        .from('payment_session_statuses' as any)
        .select('*')
        .eq('campaign_id', params.id)

      const statuses = statusesData as any[] || []

      // Merge session details with status view
      const merged = (sess as any[] || []).map((s: any) => {
        const matchingStatus = statuses.find((st: any) => st.id === s.id)
        return {
          ...s,
          status: matchingStatus?.status || s.verification_status || 'pending',
          status_reason: matchingStatus?.status_reason || s.dispute_reason || ''
        }
      })

      setSessions(merged)
    } catch (e) {
      console.error('Failed to load campaign data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!campaign) return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const shareUrl = `${appUrl}/pay/${campaign.share_link}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleArchive = async () => {
    if (!campaign) return
    const confirmed = window.confirm(
      "⚠️ WARNING: This operation cannot be undone.\n\n" +
      "This will permanently archive the campaign, generate an immutable proof manifest of all payments, and DELETE all student receipt screenshots from our cloud storage to eliminate data liability and maintain free tier storage limits.\n\n" +
      "Are you absolutely sure you want to archive and flush this campaign?"
    )
    if (!confirmed) return

    setArchiving(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/archive`, {
        method: 'POST'
      })
      const result = await response.json()
      if (response.ok) {
        alert("🎉 Campaign successfully archived! All screenshots flushed from cloud storage. Decoded transaction receipt hashes are permanently locked in the audit ledger.")
        fetchData()
      } else {
        alert(`❌ Archiving failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      alert(`❌ Error occurred: ${err.message}`)
    } finally {
      setArchiving(false)
    }
  }

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Resolving Campaign Ledger...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Campaign Not Found</h2>
        <p className="text-slate-500 mt-1">This campaign may have been deleted or archived.</p>
      </div>
    )
  }

  // Filter transaction records by selected tab
  const filteredSessions = sessions.filter(s => {
    const currentStatus = s.verification_status || s.status || 'pending'
    const isDisputed = s.is_disputed || currentStatus === 'amount_mismatch' || currentStatus === 'disputed'
    const isThirdParty = currentStatus === 'third_party_payment'
    const isVerified = currentStatus === 'verified' || currentStatus === 'auto_verified' || currentStatus === 'host_approved'

    if (filter === 'disputed') return isDisputed
    if (filter === 'third_party') return isThirdParty
    if (filter === 'verified') return isVerified
    return true
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const studentPayUrl = `${appUrl}/pay/${campaign.share_link}`

  // Count metrics for filters
  const verifiedCount = sessions.filter(s => {
    const st = s.verification_status || s.status || 'pending'
    return st === 'verified' || st === 'auto_verified' || st === 'host_approved'
  }).length

  const thirdPartyCount = sessions.filter(s => {
    const st = s.verification_status || s.status || 'pending'
    return st === 'third_party_payment'
  }).length

  const disputedCount = sessions.filter(s => {
    const st = s.verification_status || s.status || 'pending'
    return s.is_disputed || st === 'amount_mismatch' || st === 'disputed'
  }).length

  return (
    <div className="space-y-6">
      {/* Page Header (Hides on physical printing) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{campaign.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{campaign.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Ledger Button */}
          <a href={`/api/exports/${campaign.id}`} download>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Excel
            </Button>
          </a>

          {campaign.status === 'archived' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Flushed & Archived
            </div>
          ) : (
            <Button 
              onClick={handleArchive}
              disabled={archiving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2 border-0 shadow-md transition-colors"
            >
              {archiving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Flushing...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" /> Archive & Flush
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Stats Component */}
      <CampaignStats amount={campaign.amount} sessions={sessions} />

      {/* Broadcast Manager Component (Hides on physical printing) */}
      <div className="no-print">
        <BroadcastManager campaignId={campaign.id} />
      </div>

      {/* Campaign Details & Share Card (Hides on physical printing) */}
      <div className="grid gap-6 md:grid-cols-3 no-print">
        <Card className="md:col-span-2 shadow-sm border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Destination Account & Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receiving Bank</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{campaign.bank_name}</div>
                <div className="text-xs font-mono font-medium text-slate-650 mt-0.5">
                  {campaign.account_number} • {campaign.account_name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline & Ends</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {new Date(campaign.ends_at).toLocaleString()}
                </div>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 uppercase ${
                  new Date(campaign.ends_at) > new Date() ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {new Date(campaign.ends_at) > new Date() ? 'Collecting' : 'Ended'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Share Card */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Student Portal Ingress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Distribute this link to students to allow payment uploads.
            </p>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 border border-slate-100 select-all font-mono text-[11px] font-bold text-slate-700 break-all">
              {studentPayUrl}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button 
                onClick={handleCopyLink}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <a 
                href={`/pay/${campaign.share_link}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Launch
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast & Registrant Managers (Hides on physical printing) */}
      <div className="no-print grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <BroadcastManager campaignId={campaign.id} />
        </div>
        <div>
          <RegistrantManager campaignId={campaign.id} />
        </div>
      </div>

      {/* Reconciliation Table Component */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between no-print">
          <h2 className="text-lg font-bold text-slate-900">Reconciliation Ledger</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()}
              className="text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Ledger
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              className="text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-px mb-4 no-print overflow-x-auto">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              filter === 'all' 
                ? 'text-blue-600 border-blue-600' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            All ({sessions.length})
          </button>
          <button 
            onClick={() => setFilter('verified')} 
            className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              filter === 'verified' 
                ? 'text-emerald-600 border-emerald-600' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            ✅ Verified ({verifiedCount})
          </button>
          <button 
            onClick={() => setFilter('third_party')} 
            className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              filter === 'third_party' 
                ? 'text-amber-600 border-amber-600' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            🟡 Third Party ({thirdPartyCount})
          </button>
          <button 
            onClick={() => setFilter('disputed')} 
            className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              filter === 'disputed' 
                ? 'text-rose-600 border-rose-600' 
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            🔴 Disputed ({disputedCount})
          </button>
        </div>

        {/* Dynamic Ledger table */}
        <ReconciliationTable 
          sessions={filteredSessions} 
          campaignId={campaign.id} 
          onStatusUpdated={fetchData} 
        />

        {/* Printable Ledger Actions Footer (Visible ONLY during print layout) */}
        <div className="hidden print:block border-t border-slate-300 pt-4 mt-6 text-[10px] text-slate-500 leading-relaxed font-semibold">
          <p className="font-bold text-slate-800 text-xs mb-1.5">RECONCILIATION INSTRUCTIONS FOR DEPARTMENT SECRETARY:</p>
          <p>1. High-fidelity color highlighting maps directly to system verification alerts:</p>
          <p className="pl-3">• Yellow Highlight rows represent third-party sponsor payments. Cross-reference manually with bank bank statements.</p>
          <p className="pl-3">• Red Highlight rows represent amount mismatch alerts. Review corresponding transaction receipt attachments immediately.</p>
          <p>2. Record host verification action details in the printed ledger margin. Contact disputing students if payments are deemed missing.</p>
        </div>
      </div>
    </div>
  )
}
