'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, XCircle, BarChart3, ShieldCheck } from 'lucide-react'

interface StatsProps {
  amount: number
  sessions: any[]
}

export function CampaignStats({ amount, sessions }: StatsProps) {
  const totalUploads = sessions.length
  const verified = sessions.filter(s => s.status === 'verified' || s.status === 'auto_verified' || s.status === 'host_approved').length
  const pending = sessions.filter(s => s.status === 'pending' || s.status === 'manual_review' || s.is_disputed || s.status === 'disputed').length
  const rejected = sessions.filter(s => s.status === 'host_rejected' || s.status === 'auto_rejected').length

  const verifiedAmount = verified * amount
  const expectedTotal = totalUploads * amount
  const verificationRate = totalUploads > 0 ? (verified / totalUploads) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Informational Disclaimer Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">LevyFlow Proof-Tracking Protocol Active</strong>
          LevyFlow does not hold, process, or route student funds. All fees are paid directly to the target department bank account. 
          The metrics below represent student uploaded payment proof sessions recorded in the transaction ledger.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold tracking-wider uppercase opacity-90">Verified Proofs Value</CardTitle>
            <ShieldCheck className="w-5 h-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">₦{verifiedAmount.toLocaleString()}</div>
            <p className="text-xs text-white/80 mt-1">
              Out of ₦{expectedTotal.toLocaleString()} proof value submitted
            </p>
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <BarChart3 className="w-32 h-32" />
            </div>
          </CardContent>
        </Card>

        {/* Verified Count Card */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Verified Receipts</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{verified}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${verificationRate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">{verificationRate.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Review Card */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Review</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{pending}</div>
            <p className="text-xs text-slate-500 mt-1">
              Awaiting manual bank reconciliation
            </p>
          </CardContent>
        </Card>

        {/* Rejected Card */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Rejected Uploads</CardTitle>
            <XCircle className="w-5 h-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{rejected}</div>
            <p className="text-xs text-slate-500 mt-1">
              Proofs deemed invalid or not received
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
