'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudentForm } from '@/components/StudentForm'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { LiveMarquee } from '@/components/LiveMarquee'
import { CountdownTimer } from '@/components/CountdownTimer'
import { PaymentReceiptQR } from '@/components/PaymentReceiptQR'
import { HostTrustBadge } from '@/components/HostTrustBadge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  KeyRound, 
  Check, 
  Copy, 
  AlertCircle 
} from 'lucide-react'

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'disputed'

export default function PaymentPage({ params }: { params: { shareLink: string } }) {
  const [campaign, setCampaign] = useState<any>(null)
  const [school, setSchool] = useState<any>(null)
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [sessionId, setSessionId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDisputing, setIsDisputing] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submittedMatric, setSubmittedMatric] = useState('')
  const supabase = createClient()

  const [token, setToken] = useState('')
  const [tokenValidated, setTokenValidated] = useState(false)
  const [validatingToken, setValidatingToken] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [registrant, setRegistrant] = useState<any>(null)
  const [usesRemaining, setUsesRemaining] = useState(3)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchCampaign()
  }, [params.shareLink])

  async function fetchCampaign() {
    if (params.shareLink === 'demo') {
      setCampaign({
        id: 'demo-campaign-id',
        title: 'Economics Department Dues - Year 2026',
        amount: 5000,
        bank_name: 'Wema Bank',
        account_number: '0123456789',
        account_name: 'UNILAG Economics Association',
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
        school: {
          name: 'University of Lagos'
        }
      })
      setSchool({
        primary_color: '#1e3a8a',
        school_name_display: 'Economics Association'
      })
      return
    }

    try {
      const { data, error: fetchErr } = await (supabase
        .from('campaigns') as any)
        .select('*, school:school_id(*), host:host_id(*)')
        .eq('share_link', params.shareLink)
        .eq('status', 'active')
        .single()

      if (fetchErr || !data) {
        setError('Campaign not found, expired, or is currently inactive.')
      } else {
        setCampaign(data)
        fetchSchoolConfig(data.school_id)
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching campaign.')
    }
  }

  async function fetchSchoolConfig(schoolId: string) {
    const { data } = await (supabase
      .from('school_configs') as any)
      .select('*')
      .eq('school_id', schoolId)
      .single()

    if (data) setSchool(data)
  }

  async function handleValidateToken() {
    if (!token || token.length !== 4) {
      setTokenError('Token must be exactly 4 digits.')
      return
    }
    setValidatingToken(true)
    setTokenError(null)

    if (params.shareLink === 'demo') {
      setTimeout(() => {
        setRegistrant({
          id: 'demo-registrant-id',
          name: 'Chinedu Okafor',
          matric: 'UL/22/ECO/1042'
        })
        setUsesRemaining(3)
        setTokenValidated(true)
        setValidatingToken(false)
      }, 800)
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await response.json()
      if (!data.valid) {
        setTokenError(data.message || 'Invalid access token.')
      } else {
        setRegistrant(data.registrant)
        setUsesRemaining(data.uses_remaining)
        setTokenValidated(true)
      }
    } catch (e: any) {
      setTokenError(e.message || 'Network validation error occurred.')
    } finally {
      setValidatingToken(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(formData: FormData) {
    setStatus('processing')

    if (params.shareLink === 'demo') {
      const screenshot = formData.get('screenshot') as File
      if (screenshot) setUploadedFile(screenshot)

      const name = formData.get('student_name') as string
      const matric = formData.get('matric_number') as string
      setSubmittedName(name || 'Chinedu Okafor')
      setSubmittedMatric(matric || 'UL/22/ECO/1042')

      setTimeout(() => {
        setSessionToken('LF-DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase())
        setStatus('success')
      }, 2000)
      return
    }

    try {
      const screenshot = formData.get('screenshot') as File
      if (screenshot) setUploadedFile(screenshot)

      const name = formData.get('student_name') as string
      const matric = formData.get('matric_number') as string
      setSubmittedName(name || '')
      setSubmittedMatric(matric || '')

      formData.append('access_token', token)
      if (registrant?.id) {
        formData.append('registrant_id', registrant.id)
      }

      const response = await fetch(`/api/campaigns/${campaign.id}/sessions`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setSessionToken(result.reference)
        if (result.status === 'verified') {
          setStatus('success')
        } else {
          setSessionId(result.sessionId)
          setStatus('failed')
        }
      } else {
        setError(result.message || 'Upload and verification failed.')
      }
    } catch (err: any) {
      setError(err?.message || 'Server error occurred during upload.')
    }
  }

  async function handleRaiseDispute() {
    if (!sessionId || !uploadedFile) return
    setIsDisputing(true)
    try {
      const disputeData = new FormData()
      disputeData.append('action', 'dispute')
      disputeData.append('sessionId', sessionId)
      disputeData.append('screenshot', uploadedFile)

      const response = await fetch(`/api/campaigns/${campaign.id}/sessions`, {
        method: 'POST',
        body: disputeData
      })

      if (response.ok) {
        setStatus('disputed')
      } else {
        const result = await response.json()
        setError(result.message || 'Could not record dispute.')
      }
    } catch (err: any) {
      setError(err?.message || 'Server error occurred while raising dispute.')
    } finally {
      setIsDisputing(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Verification Gate Issue</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
          >
            Retry Verification
          </Button>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Resolving whitelabel security parameters...</p>
        </div>
      </div>
    )
  }

  const primaryColor = school?.primary_color || '#1E40AF'

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
        <PaymentReceiptQR 
          studentName={submittedName}
          matricNumber={submittedMatric}
          amount={campaign.amount}
          campaignTitle={campaign.title}
          reference={sessionToken}
          timestamp={new Date().toISOString()}
        />
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center backdrop-blur-lg">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Screenshot Not Recognized
          </h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Our automated scanner couldn&apos;t read your payment screenshot details. 
            <strong className="text-slate-200 block mt-2">If you actually completed the transfer, click Dispute to request a manual review by your department. Your submission is saved in either case.</strong>
          </p>

          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mb-6 text-left space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="text-slate-500 uppercase font-semibold">Reference Token:</span>
              <span className="font-mono text-blue-400 font-bold">{sessionToken}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRaiseDispute}
              disabled={isDisputing}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-lg shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
            >
              {isDisputing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Dispute...
                </>
              ) : (
                <>
                  Dispute & Request Manual Review
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setStatus('idle')}
              className="w-full text-slate-400 hover:text-white"
            >
              Upload Different Screenshot
            </Button>
          </div>
          <LegalDisclaimer variant="dark" />
        </div>
      </div>
    )
  }

  if (status === 'disputed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center backdrop-blur-lg">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Dispute Registered
          </h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your dispute has been logged successfully. The department will manually verify your uploaded proof screenshot against their bank ledger.
          </p>
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dispute Tracking Token</p>
            <p className="font-mono text-sm font-bold text-blue-400 break-all select-all">{sessionToken}</p>
          </div>
          <Button 
            onClick={() => window.close()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/20"
          >
            Close Portal
          </Button>
          <LegalDisclaimer variant="dark" />
        </div>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute w-[200px] h-[200px] bg-blue-600/5 rounded-full blur-[80px] -top-16 -left-16" />
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-5" />
          <h2 className="text-lg font-black text-white tracking-wide flex items-center justify-center gap-1.5 mb-1.5">
            OCR Document AI Scanning <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            We are extracting transaction codes, timestamp hashes, and verifying your matching record names synchronously. Please do not close this window.
          </p>
        </div>
      </div>
    )
  }

  if (!tokenValidated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-slate-950/60 backdrop-blur-[2px] -z-10" />
        <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] -top-48 -left-48 -z-10" />

        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
              <KeyRound className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Access Gated Payment Gate</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              To prevent duplicate submissions, matric-farming, and malicious spam attempts, you must authenticate with your 4-digit code.
            </p>
          </div>

          {campaign.ends_at && (
            <div className="mb-6">
              <CountdownTimer deadline={new Date(campaign.ends_at)} />
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={token}
              maxLength={4}
              pattern="[0-9]{4}"
              onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 7382"
              className="flex-1 text-center text-3xl font-mono tracking-widest p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <button
              onClick={handleCopy}
              className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Copy Token"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-500" />}
            </button>
          </div>

          {tokenError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {tokenError}
            </div>
          )}

          <button
            onClick={handleValidateToken}
            disabled={validatingToken}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {validatingToken ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking Code...
              </>
            ) : (
              <>
                Validate & Unlock Portal <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have a 4-digit code?
            </p>
            <a 
              href={`/register/${campaign.id}`}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 mt-1 inline-block hover:underline"
            >
              Click here to pre-register and get a token
            </a>
          </div>

          <LegalDisclaimer variant="light" />
        </div>
      </div>
    )
  }

  return (
    <>
      <LiveMarquee campaignId={campaign.id} />
      <div 
        className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-slate-950/60 backdrop-blur-[2px] -z-10" />
        <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] -top-48 -left-48 -z-10" />
        
        <div className="max-w-md mx-auto relative">
          <div className="text-center mb-6">
            {school?.logo_url ? (
              <img 
                src={school.logo_url} 
                alt={school.school_name_display || campaign.school?.name}
                className="h-16 mx-auto mb-4 rounded-full border-2 border-white/20 shadow-md object-contain bg-white p-1"
              />
            ) : (
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-md">
                <span className="text-white text-2xl font-bold uppercase">{campaign.school?.name?.substring(0, 2)}</span>
              </div>
            )}
            <h1 className="text-2xl font-black text-white tracking-tight">
              {campaign.title}
            </h1>
            <p className="text-white/80 mt-1.5 text-xs">
              Authenticated Student: <strong className="text-white">{registrant.name} ({registrant.matric})</strong>
            </p>
            <p className="text-white/70 mt-1 text-[10px]">
              Access attempts remaining: <strong className="text-white">{usesRemaining}/3</strong>
            </p>
          </div>

          {campaign.ends_at && (
            <div className="mb-5">
              <CountdownTimer deadline={new Date(campaign.ends_at)} />
            </div>
          )}

          {/* Host Profile Trust Card */}
          <HostTrustBadge host={campaign.host} />

          <StudentForm 
            campaign={campaign}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  )
}
