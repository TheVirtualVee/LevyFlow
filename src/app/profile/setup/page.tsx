'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Briefcase, Building2, ArrowRight, SkipForward, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfileSetupPage() {
  const [user, setUser] = useState<any>(null) as [any, any]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    department: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login')
      } else {
        setUser(data.user)
        // Pre-fill if partial profile exists
        (supabase
          .from('user_profiles') as any)
          .select('full_name, title, department')
          .eq('id', data.user.id)
          .maybeSingle()
          .then(({ data: profile }: any) => {
            if (profile) {
              setFormData({
                full_name: profile.full_name || '',
                title: profile.title || '',
                department: profile.department || ''
              })
            }
            setLoading(false)
          })
      }
    })
  }, [router, supabase])

  async function saveProfile() {
    if (!formData.full_name.trim()) return
    
    setSaving(true)
    const { error } = await (supabase
      .from('user_profiles') as any)
      .upsert({
        id: user.id,
        email: user.email,
        full_name: formData.full_name.trim(),
        title: formData.title.trim(),
        department: formData.department.trim(),
        updated_at: new Date().toISOString()
      })
    
    setSaving(false)
    if (!error) {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-slate-400 font-medium text-xs">Resolving verification parameters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950 -z-20" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -top-48 -left-48 -z-10 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -bottom-36 -right-36 -z-10" />

      <div className="max-w-md w-full z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-md">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Complete in 30 seconds</h1>
              <p className="text-white/80 text-xs mt-1 max-w-xs mx-auto">
                Verified hosts get a trust badge. Students pay more confidently.
              </p>
            </div>
          </div>
          
          {/* Form */}
          <div className="p-6 space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Full Name <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="pl-10 py-3 bg-slate-950/80 border-slate-800 focus:border-blue-500 text-white rounded-xl text-sm"
                  placeholder="Dr. Opeyemi Michael"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Title / Position
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="pl-10 py-3 bg-slate-950/80 border-slate-800 focus:border-blue-500 text-white rounded-xl text-sm"
                  placeholder="e.g. Senior Lecturer, HOD, Professor"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Department
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="pl-10 py-3 bg-slate-950/80 border-slate-800 focus:border-blue-500 text-white rounded-xl text-sm"
                  placeholder="e.g. English Department"
                />
              </div>
            </div>
            
            <Button
              onClick={saveProfile}
              disabled={!formData.full_name.trim() || saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/10"
            >
              {saving ? 'Saving...' : 'Get Verified Badge'}
              {!saving && <ArrowRight className="w-4 h-4" />}
            </Button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-slate-400 text-xs py-2 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip for now (your campaigns will show "Unverified Host")
            </button>
            
            <p className="text-[10px] text-slate-500 text-center mt-4">
              LevyFlow never holds funds. All payments route directly to your bank account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
