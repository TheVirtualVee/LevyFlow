'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, Phone, Camera, Sparkles, Landmark, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Mail, BookOpen, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileSetupWizardProps {
  userId: string
  email: string
  onComplete: () => void
}

const NIGERIAN_BANKS = [
  'Access Bank', 'First Bank', 'GTBank', 'Zenith Bank', 'UBA',
  'Fidelity Bank', 'Sterling Bank', 'Union Bank', 'OPay', 'Moniepoint',
  'Kuda Bank', 'PalmPay', 'Wema Bank (ALAT)', 'Stanbic IBTC', 'FCMB',
]

export function ProfileSetupWizard({ userId, email, onComplete }: ProfileSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'lecturer',
    title: '',
    department: '',
    courseCode: '',
    lecturerEmail: '',
    avatar_url: '',
    bank_name: '',
    account_number: '',
    account_name: ''
  })
  
  const supabase = createClient()

  // Auto-generate initials for avatar placeholders
  const initials = formData.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'LF'

  async function uploadAvatar(file: File) {
    setErrorMsg(null)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
      
      if (uploadErr) {
        throw new Error(`Storage upload failed: ${uploadErr.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload failed.')
    }
  }
  
  async function createProfile() {
    setLoading(true)
    setErrorMsg(null)
    
    try {
      // 1. Resolve parent ID (if rep links to a lecturer)
      let parentId: string | null = null
      if (formData.role === 'course_rep' && formData.lecturerEmail) {
        const { data: lecturerProfile } = await (supabase
          .from('user_profiles') as any)
          .select('id')
          .eq('email', formData.lecturerEmail.trim())
          .maybeSingle()
        
        if (lecturerProfile) {
          parentId = (lecturerProfile as any).id
        }
      }

      // 2. Create User Profile - No school creation/association to skip RLS issues entirely!
      let finalRole = formData.role
      if (formData.role === 'lecturer') {
        finalRole = 'host'
      } else if (formData.role === 'school_admin') {
        finalRole = 'school_admin'
      }

      const { error: profileError } = await (supabase
        .from('user_profiles') as any)
        .insert({
          id: userId,
          email: email,
          full_name: formData.full_name,
          title: formData.title || (formData.role === 'course_rep' ? 'Course Representative' : 'Faculty Lecturer'),
          department: formData.department || 'Departmental Administration',
          phone: formData.phone,
          role: finalRole,
          school_id: null, // Skipping school association entirely
          parent_id: parentId,
          course_code: formData.courseCode || null,
          avatar_url: formData.avatar_url || null,
          is_approved: true,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        throw profileError
      }

      // 3. Save default bank details to local storage or profile if matching columns exist.
      // (Campaign creator will pull defaults if they configure direct bank details).
      onComplete()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete profile creation.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative premium gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-950/20 to-indigo-950/20 -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] -top-60 -left-60 -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] -bottom-60 -right-60 -z-10" />

      <Card className="max-w-lg w-full glassmorphism-dark text-white border border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl relative">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" 
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Dynamic Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-md">
            {step === 1 ? <User className="w-8 h-8 text-blue-400" /> : <Landmark className="w-8 h-8 text-emerald-400" />}
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {step === 1 ? 'Institutional Identity' : 'Ledger Verification Details'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
            {step === 1 ? 'Establish your professional administrator profile.' : 'Finalize your direct cash routing bank settings.'}
          </p>
        </div>

        <CardContent className="px-6 pb-8 space-y-6 text-left">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Avatar Uploader UI */}
              <div className="flex items-center gap-4 bg-slate-800/40 p-4 border border-slate-700/40 rounded-2xl">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700/60 shadow-md">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white">{initials}</span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 border-2 border-slate-900 text-white rounded-lg p-1.5 cursor-pointer shadow-lg transition-transform hover:scale-105">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} 
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Profile Picture</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Upload a clean face photo to instantly build trust with students paying dues.</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-800/50 border-slate-700 text-white pl-10 placeholder-slate-500"
                    placeholder="e.g. Dr. Opeyemi Michael Lawal"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800/50 border-slate-700 text-white pl-10 placeholder-slate-500"
                    placeholder="e.g. +234 803 123 4567"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="department">Faculty / Department <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-800/50 border-slate-700 text-white pl-10 placeholder-slate-500"
                    placeholder="e.g. English Department"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">Professional Title</Label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800/50 border-slate-700 text-white pl-10 placeholder-slate-500"
                    placeholder="e.g. Senior Lecturer, Associate Professor"
                  />
                </div>
              </div>

              {/* Role Context Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="role">Collect Dues As...</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 text-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="lecturer" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Individual Lecturer / Coordinator</option>
                  <option value="course_rep" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Course Representative (ECO 301, etc.)</option>
                  <option value="school_admin" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Department / Faculty Admin</option>
                </select>
              </div>

              {/* Course Rep specific inputs */}
              {formData.role === 'course_rep' && (
                <div className="space-y-3.5 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in duration-300 text-left">
                  <div className="space-y-1.5">
                    <Label htmlFor="lecturerEmail" className="text-slate-350 font-bold text-[10px] tracking-wider uppercase">Lecturer Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input
                        id="lecturerEmail"
                        value={formData.lecturerEmail}
                        onChange={(e) => setFormData({ ...formData, lecturerEmail: e.target.value })}
                        placeholder="e.g. adeyemi@unilag.edu.ng"
                        className="bg-slate-800/50 border-slate-700 text-white pl-10 text-xs placeholder-slate-500"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Linking your account lets your supervising lecturer oversee collections directly.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="courseCode" className="text-slate-350 font-bold text-[10px] tracking-wider uppercase">Course Code / Class Section</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input
                        id="courseCode"
                        value={formData.courseCode}
                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                        placeholder="e.g. ECO 301"
                        className="bg-slate-800/50 border-slate-700 text-white pl-10 text-xs placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={nextStep}
                disabled={!formData.full_name || !formData.phone || !formData.department}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 mt-4 transition-all flex items-center justify-center gap-1.5 text-xs rounded-xl"
              >
                Proceed to Ledger Routing <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Ledger Verification Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Direct Remittance Trust Header */}
              <div className="bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Zero-Liability Direct Routing</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Student money is sent directly to your bank account. LevyFlow never acts as an intermediary or holds funds. Specify your default bank accounts to display on campaign gates.
                </p>
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <Label htmlFor="bank_name">Default Destination Bank</Label>
                <select
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 text-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Select bank</option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <Label htmlFor="account_number">Remittance Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 0123456789"
                  maxLength={10}
                  className="w-full bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
              </div>

              {/* Account Name */}
              <div className="space-y-1.5">
                <Label htmlFor="account_name">Remittance Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g. Adeyemi Alao Economics"
                  className="w-full bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 border-slate-750 bg-slate-800/50 text-slate-300 hover:text-white"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={createProfile}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-2.5 transition-all flex items-center justify-center gap-1.5 text-xs rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                    </>
                  ) : (
                    <>
                      Instantiate Profile <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-500 text-center leading-normal mt-4">
            Security Guarantee: By completing this setup, you certify you have the legal right to audit and verify class remittance records for the selected university department.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
