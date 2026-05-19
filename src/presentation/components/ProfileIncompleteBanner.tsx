'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileSetupWizard } from './ProfileSetupWizard'

export function ProfileIncompleteBanner() {
  const [profile, setProfile] = useState<any>(null)
  const [userMetadata, setUserMetadata] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    async function checkProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserMetadata({ id: user.id, email: user.email || '' })
          const { data } = await (supabase
            .from('user_profiles') as any)
            .select('full_name, title, department')
            .eq('id', user.id)
            .maybeSingle()
          setProfile(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    checkProfile()
  }, [supabase])

  if (loading || dismissed) return null

  // A complete profile requires at least full_name and department
  const isComplete = profile?.full_name && profile?.department

  if (isComplete) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 mb-6 shadow-sm flex items-center justify-between animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-800">Verified Host Active — Students see your premium verification trust badge</span>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 mb-6 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">Identity Verification Suggested</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Students may see <span className="font-semibold text-amber-600">"Unverified Host"</span> on payment gates. Set your identity details in 30 seconds to show a premium verification trust badge.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            Get Verified Badge <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <button 
            onClick={() => setDismissed(true)} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Overlay Modal */}
      {showModal && userMetadata && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setShowModal(false)} />
          <div className="w-full max-w-lg z-10 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl p-2 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <ProfileSetupWizard 
              userId={userMetadata.id}
              email={userMetadata.email}
              onComplete={() => {
                setShowModal(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
