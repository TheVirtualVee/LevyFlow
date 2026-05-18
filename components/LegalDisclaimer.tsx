'use client'

import { ShieldCheck } from 'lucide-react'

interface LegalDisclaimerProps {
  variant?: 'dark' | 'light'
}

export function LegalDisclaimer({ variant = 'light' }: LegalDisclaimerProps) {
  const isDark = variant === 'dark'
  
  return (
    <footer className={`mt-8 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
      <div className="flex items-start gap-2.5 max-w-md mx-auto">
        <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
        <p className={`text-[10px] leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          LevyFlow is a proof-of-payment tracking platform. We do not process, hold, or transfer money.
          Payments are made directly to the institution&apos;s bank account.
          All payment disputes must be resolved with the institution directly.
        </p>
      </div>
    </footer>
  )
}
