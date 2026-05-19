'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Edit2, CheckCircle, AlertCircle, Sparkles, User, Mail, Phone, Building2, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    department: '',
    phone: '',
    avatar_url: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    setErrorMsg(null)
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        setErrorMsg('Authentication required.')
        return
      }

      const { data, error } = await (supabase
        .from('user_profiles') as any)
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        title: data.title || '',
        department: data.department || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch profile details.')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    setUpdating(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await (supabase
        .from('user_profiles') as any)
        .update({
          full_name: formData.full_name,
          title: formData.title,
          department: formData.department,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) throw error

      setSuccessMsg('Profile updated successfully!')
      setEditing(false)
      fetchProfile()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details.')
    } finally {
      setUpdating(false)
    }
  }

  async function uploadAvatar(file: File) {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
      
      if (uploadErr) {
        throw new Error(`Storage upload failed. Make sure the 'avatars' storage bucket is created in Supabase: ${uploadErr.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      const { error: updateErr } = await (supabase
        .from('user_profiles') as any)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
      
      if (updateErr) throw updateErr
      
      setSuccessMsg('Profile picture uploaded successfully!')
      fetchProfile()
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload failed.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Loading profile credentials...</p>
        </div>
      </div>
    )
  }

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'LF'
  const isRep = profile?.role === 'course_rep'
  const roleDisplay = isRep 
    ? 'Course Representative' 
    : profile?.role === 'host' 
      ? 'Faculty Lecturer' 
      : profile?.role === 'school_admin' 
        ? 'Faculty Administrator'
        : 'Super Platform Admin'

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Dynamic Profile Header Card */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-700/50 shadow-md">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black tracking-tight text-white">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 border-2 border-slate-900 text-white rounded-xl p-2 cursor-pointer shadow-lg transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} 
                />
              </label>
            </div>
            
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">{profile.full_name}</h1>
                {profile.is_verified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3" /> Verified Host
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ⏳ Pending Review
                  </span>
                )}
              </div>
              <p className="text-slate-350 text-sm font-semibold mt-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                {profile.title || roleDisplay}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">{profile.department || 'Institutional Affiliation Unspecified'}</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setEditing(!editing)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-xl border border-slate-700/60 shadow-sm shrink-0 flex items-center gap-2 self-start md:self-auto text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {editing ? 'Cancel' : 'Edit Credentials'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      
      {/* Profile Details Content Form */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Account Credentials & Metadata
              </CardTitle>
              <CardDescription className="text-xs">Identity parameters attached to student reconciliation records.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Professional Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Dr., Professor, Course Representative"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="department">Department / Faculty</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        placeholder="e.g. English & Literary Studies"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="e.g. +234 803 123 4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="avatar_url">Avatar URL <span className="text-slate-400 font-normal text-[10px]">(Optional alternative link)</span></Label>
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                      placeholder="e.g. https://mycdn.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4 justify-end">
                    <Button
                      onClick={() => setEditing(false)}
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateProfile}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs"
                    >
                      {updating ? 'Saving changes...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.phone || 'No phone set'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departmental Affiliation</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile.department || 'Not configured'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role Status</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{roleDisplay}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Public Host Link</p>
                    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <code className="text-xs text-slate-600 font-semibold select-all truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/public/${profile.id}` : `/public/${profile.id}`}
                      </code>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}/public/${profile.id}`)
                            setSuccessMsg('Link copied to clipboard!')
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 shrink-0 font-bold p-1 h-auto flex items-center gap-1"
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information Cards */}
        <div className="space-y-6 text-left">
          {/* Why LevyFlow Trust Badge */}
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50 border border-blue-200/60 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Strict Zero-Liability Trust</h3>
              <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                LevyFlow acts solely as a **forensic ledger** to cross-reference payment proofs. We never hold student funds or handle financial transactions under any circumstances.
              </p>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed font-medium">
                Identity parameter updates guarantee students know exactly whom they are paying.
              </p>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3 text-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Security Notice</h4>
            <p className="text-[11px] text-slate-350 leading-normal">
              Profile parameters are logged permanently into campaign audit transcripts. Make sure to double check your full name and OPay/Moniepoint/GTBank account routing details inside campaign setup screens to prevent any reconciliation confusion.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
