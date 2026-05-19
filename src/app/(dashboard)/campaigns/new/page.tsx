'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const NIGERIAN_BANKS = [
  'Access Bank', 'First Bank', 'GTBank', 'Zenith Bank', 'UBA',
  'Fidelity Bank', 'Sterling Bank', 'Union Bank', 'OPay', 'Moniepoint',
  'Kuda Bank', 'PalmPay', 'Wema Bank (ALAT)', 'Stanbic IBTC', 'FCMB',
]

const schema = z.object({
  title: z.string().min(5, 'Campaign title must be at least 5 characters'),
  description: z.string().optional(),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount exceeds maximum allowed (₦1,000,000)'),
  bank_name: z.string().min(1, 'Select a bank'),
  account_number: z
    .string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  account_name: z.string().min(3, 'Account name is required'),
  ends_at: z.string().min(1, 'Deadline is required'),
})

type FormValues = z.infer<typeof schema>

export default function NewCampaignPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseReps, setCourseReps] = useState<any[]>([])
  const [selectedRepId, setSelectedRepId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    async function loadReps() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await (supabase
          .from('user_profiles') as any)
          .select('school_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.school_id) {
          const { data: reps } = await (supabase
            .from('user_profiles') as any)
            .select('id, full_name, course_code')
            .eq('school_id', profile.school_id)
            .eq('role', 'course_rep')
          
          if (reps) setCourseReps(reps)
        }
      } catch (e) {
      }
    }
    loadReps()
  }, [])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        setServerError('You must be signed in to create a campaign.')
        return
      }

      const { data: profileData, error: profileErr } = await (supabase
        .from('user_profiles') as any)
        .select('school_id, is_approved')
        .eq('id', user.id)
        .maybeSingle()

      const profile = profileData as any

      if (profileErr || !profile) {
        setServerError('Your profile is not properly configured. Contact your admin.')
        return
      }

      if (!profile.is_approved) {
        setServerError('Your account is pending approval. Contact your school admin.')
        return
      }

      const shareLink = `${values.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}-${Date.now().toString(36)}`

      const { data: campaignData, error: insertErr } = await (supabase
        .from('campaigns') as any)
        .insert({
          host_id: user.id,
          school_id: profile?.school_id || null,
          title: values.title,
          description: values.description || null,
          amount: values.amount,
          bank_name: values.bank_name,
          account_number: values.account_number,
          account_name: values.account_name,
          ends_at: new Date(values.ends_at).toISOString(),
          status: 'active',
          share_link: shareLink,
          owner_id: user.id,
          manager_id: selectedRepId || user.id
        })
        .select()
        .single()

      const campaign = campaignData as any

      if (insertErr) {
        setServerError(insertErr.message)
        return
      }

      router.push(`/campaigns/${campaign.id}`)
    } catch (e: any) {
      setServerError(e?.message || 'Unexpected error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const minDeadline = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Configure your payment collection campaign. Students will use the unique share link to upload proof.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Campaign Details</CardTitle>
          <CardDescription>All fields are required unless stated otherwise.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="new-campaign-form">

            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {serverError}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g. 2024/2025 Faculty Dues — 300 Level"
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-slate-400">(optional)</span>
              </Label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                placeholder="Additional instructions for students..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Required Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                {...register('amount')}
                placeholder="5000"
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Delegation & Cash Routing */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Delegation & Cash Control</h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="payment_destination">Payment Destination</Label>
                <select
                  id="payment_destination"
                  className="flex h-9 w-full rounded-md border border-input bg-white text-slate-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
                >
                  <option value="direct">My Lecturer Account (Enter bank details below)</option>
                  <option value="dept">Departmental General Account</option>
                </select>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Money goes directly to your specified account. LevyFlow never holds or sits on institutional funds.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="delegate_to">Delegate Management To</Label>
                <select
                  id="delegate_to"
                  value={selectedRepId}
                  onChange={(e) => setSelectedRepId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white text-slate-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
                >
                  <option value="">Myself (I will manage this campaign)</option>
                  {courseReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.full_name} ({rep.course_code || 'No Course'} Rep)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Course reps can register expectant student lists and track payment verifications. They will never touch physical cash or bank access.
                </p>
              </div>
            </div>

            {/* Bank details header */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account Remittance</h3>
            </div>

            {/* Bank */}
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Bank Name</Label>
              <select
                id="bank_name"
                {...register('bank_name')}
                className="flex h-9 w-full rounded-md border border-input bg-white text-slate-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.bank_name && (
                <p className="text-xs text-red-600">{errors.bank_name.message}</p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                {...register('account_number')}
                placeholder="0123456789"
                maxLength={10}
              />
              {errors.account_number && (
                <p className="text-xs text-red-600">{errors.account_number.message}</p>
              )}
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                {...register('account_name')}
                placeholder="As it appears on your bank app"
              />
              {errors.account_name && (
                <p className="text-xs text-red-600">{errors.account_name.message}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="ends_at">Collection Deadline</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                min={minDeadline}
                {...register('ends_at')}
              />
              {errors.ends_at && (
                <p className="text-xs text-red-600">{errors.ends_at.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
            >
              {isSubmitting ? 'Creating Campaign…' : 'Create Campaign & Get Share Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
