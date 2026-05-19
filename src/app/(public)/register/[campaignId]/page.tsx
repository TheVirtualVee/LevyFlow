'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { CountdownTimer } from '@/components/CountdownTimer'
import { ShieldCheck, Copy, Check, KeyRound, UserPlus, Loader2, AlertCircle } from 'lucide-react'

export default function RegistrationPage({ params }: { params: { campaignId: string } }) {
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isExisting, setIsExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const [studentName, setStudentName] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [level, setLevel] = useState('')
  const [contactInfo, setContactInfo] = useState('')

  useEffect(() => {
    fetchCampaign()
  }, [params.campaignId])

  const fetchCampaign = async () => {
    try {
      const { data, error: err } = await supabase
        .from('campaigns')
        .select('id, title, description, amount, status, ends_at')
        .eq('id', params.campaignId)
        .single()

      if (err) throw err
      setCampaign(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${params.campaignId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          matric_number: matricNumber,
          level,
          contact_info: contactInfo
        })
      })

      const data = await response.json()

      if (data.success) {
        setAccessToken(data.token)
        setIsExisting(data.existing || false)
      } else {
        setError(data.error || 'Registration failed.')
      }
    } catch (err: any) {
      setError(err.message || 'Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (accessToken) {
      navigator.clipboard.writeText(accessToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Campaign Not Found</h2>
          <p className="text-slate-500 text-sm">This registration link may have expired or been removed.</p>
        </div>
      </div>
    )
  }

  if (accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full border border-slate-100">
          <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
            <KeyRound className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {isExisting ? 'Already Registered!' : 'Registration Successful!'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {isExisting
              ? 'You were already registered. Here is your existing token.'
              : 'Your 4-digit payment access token has been generated.'}
          </p>

          {/* Giant Token Display */}
          <div className="bg-slate-900 text-white text-5xl font-mono tracking-[0.5em] py-5 px-6 rounded-2xl mb-5 select-all shadow-lg">
            {accessToken}
          </div>

          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Token'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 space-y-1.5 mb-4">
            <p className="font-bold text-amber-900">⚠️ Important — Save This Token:</p>
            <p>• You need this token to access the payment portal.</p>
            <p>• Valid for <strong>3 access attempts</strong> (in case of upload errors).</p>
            <p>• Take a screenshot of this page or write it down.</p>
            <p>• If you lose it, re-register with the same matric number to recover it.</p>
          </div>

          <div className="text-xs text-slate-400">
            Campaign: <strong className="text-slate-600">{campaign.title}</strong>
          </div>

          <LegalDisclaimer variant="light" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-slate-100">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Student Pre-Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Register to receive your payment access token</p>
        </div>

        {/* Campaign Info */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-black text-blue-800 uppercase tracking-wider">{campaign.title}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-blue-600 font-medium">Amount Due:</span>
            <span className="font-extrabold text-blue-900 text-sm">₦{campaign.amount?.toLocaleString()}</span>
          </div>
          {campaign.ends_at && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-blue-600 font-medium">Deadline:</span>
              <span className="font-bold text-blue-800">{new Date(campaign.ends_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Urgency Countdown */}
        {campaign.ends_at && (
          <div className="mb-5">
            <CountdownTimer deadline={new Date(campaign.ends_at)} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Full Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Adekunle Gold"
              required
              minLength={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Matric Number</label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                placeholder="2020/123456"
                required
                minLength={5}
                className="w-full px-3 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Level</label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. 200L"
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">WhatsApp / Phone Number</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. 0803 123 4567"
              required
              minLength={5}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Register & Get Token
              </>
            )}
          </button>
        </form>

        <LegalDisclaimer variant="light" />
      </div>
    </div>
  )
}
