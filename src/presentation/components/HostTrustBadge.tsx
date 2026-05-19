'use client'

import { CheckCircle, AlertTriangle, Shield, User, Building2, Briefcase } from 'lucide-react'

interface HostTrustBadgeProps {
  host: {
    full_name?: string
    title?: string
    department?: string
    avatar_url?: string
  } | null
}

export function HostTrustBadge({ host }: HostTrustBadgeProps) {
  const isVerified = host?.full_name && host?.title && host?.department
  
  if (!host) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700/60">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-white">Host details unavailable</p>
            <p className="text-[11px] text-slate-450 mt-0.5">Remittance goes directly to secure destination bank accounts.</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (isVerified) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          {host.avatar_url ? (
            <img 
              src={host.avatar_url} 
              alt={host.full_name} 
              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 bg-slate-900 shrink-0" 
            />
          ) : (
            <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ Verified Host
              </span>
            </div>
            <p className="font-extrabold text-sm text-white mt-1.5 truncate">{host.full_name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
              {host.title && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{host.title}</span>
                </div>
              )}
              {host.department && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{host.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 shadow-sm backdrop-blur-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold text-sm text-white flex items-center gap-2">
            Unverified Host Profile
            <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Unverified
            </span>
          </p>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            This host has not yet completed their profile credentials. Payments route directly to their bank, but verify with your course rep/coordinator before sending.
          </p>
        </div>
      </div>
    </div>
  )
}
