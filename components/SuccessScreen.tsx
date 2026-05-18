'use client'

import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

export function SuccessScreen({ reference }: { reference: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center backdrop-blur-lg">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Proof Recorded Successfully
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Your submission has been logged successfully. The department will verify your payment directly with their bank ledger.
        </p>
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reference Token</p>
          <p className="font-mono text-sm font-bold text-blue-400 break-all select-all">{reference}</p>
        </div>
        <Button 
          onClick={() => window.close()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/20"
        >
          Done
        </Button>
        <LegalDisclaimer variant="dark" />
      </div>
    </div>
  )
}
