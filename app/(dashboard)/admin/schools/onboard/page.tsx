'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').or(z.literal('')),
  primary_color: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'Must be a valid HEX color code (e.g., #1E40AF)'),
  allowed_banks: z.string().min(1, 'List at least one bank (comma-separated)'),
  auto_approve_threshold: z.coerce.number().min(0).max(100, 'Threshold must be between 0 and 100'),
  manual_review_threshold: z.coerce.number().min(0).max(100, 'Threshold must be between 0 and 100'),
  require_matric_format: z.string().min(2, 'Define a validation regex pattern (e.g. ^[0-9]{9}$)'),
})

type FormValues = z.infer<typeof schema>

export default function SchoolOnboardPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/auth/login')
          return
        }

        const { data: profile } = await (supabase
          .from('user_profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'super_admin') {
          setAuthorized(true)
        } else {
          router.replace('/campaigns')
        }
      } catch (err) {
        console.error(err)
        router.replace('/campaigns')
      }
    }
    checkAuth()
  }, [supabase, router])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primary_color: '#1E40AF',
      auto_approve_threshold: 75.0,
      manual_review_threshold: 40.0,
      require_matric_format: '^[a-zA-Z0-9/\\-_]{5,20}$'
    }
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setServerError(null)
    setSuccess(false)

    try {
      // 1. Double check authorization role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setServerError('You must be authenticated.')
        return
      }

      const { data: profileData } = await (supabase
        .from('user_profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

      const profile = profileData as any

      if (!profile || profile.role !== 'super_admin') {
        setServerError('Forbidden. Only super admins can onboard new institutions.')
        return
      }

      // 2. Perform transaction creation: School first, then Config
      // Insert school
      const { data: schoolData, error: schoolErr } = await (supabase
        .from('schools') as any)
        .insert({
          name: values.name,
          slug: values.slug,
          domain: values.domain || null,
          logo_url: values.logo_url || null
        })
        .select()
        .single()

      const school = schoolData as any

      if (schoolErr) {
        throw new Error(`School insertion failed: ${schoolErr.message}`)
      }

      // Format allowed banks to string array
      const bankArray = values.allowed_banks
        .split(',')
        .map(b => b.trim())
        .filter(b => b.length > 0)

      // Insert school configs
      const { error: configErr } = await (supabase
        .from('school_configs') as any)
        .insert({
          school_id: school.id,
          logo_url: values.logo_url || null,
          primary_color: values.primary_color,
          school_name_display: values.name,
          allowed_banks: bankArray,
          auto_approve_threshold: values.auto_approve_threshold,
          manual_review_threshold: values.manual_review_threshold,
          require_matric_format: values.require_matric_format,
          enable_qr_evidence: true,
          enable_email_receipt: false
        })

      if (configErr) {
        // Rollback school since config failed
        await (supabase.from('schools') as any).delete().eq('id', school.id)
        throw new Error(`Config insertion failed (rolled back school): ${configErr.message}`)
      }

      setSuccess(true)
      reset()
    } catch (e: any) {
      setServerError(e?.message || 'Unexpected server error onboarding school.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium">Verifying Credentials...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 border border-blue-200">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">School Onboarding</h1>
          <p className="text-slate-500 text-sm mt-1">Tenant Whitelabelling & Automated Verification Configuration</p>
        </div>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Onboard Institution</CardTitle>
          <CardDescription>Creates a new tenant and configures dynamic OCR & matric validation formats.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>School on-boarded and configured successfully!</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">School Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g. University of Lagos" />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug">Subdomain / Slug</Label>
                <Input id="slug" {...register('slug')} placeholder="e.g. unilag" />
                {errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Domain */}
              <div className="space-y-1.5">
                <Label htmlFor="domain">Custom Domain <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input id="domain" {...register('domain')} placeholder="e.g. portal.unilag.edu.ng" />
              </div>

              {/* Primary Color */}
              <div className="space-y-1.5">
                <Label htmlFor="primary_color">Primary Brand Color (HEX)</Label>
                <div className="flex gap-2">
                  <Input id="primary_color" {...register('primary_color')} placeholder="#1E40AF" maxLength={7} />
                  <input 
                    type="color" 
                    className="w-10 h-9 p-0 border border-slate-200 rounded-md cursor-pointer shrink-0"
                    onChange={(e) => {
                      // Trigger updating the field manually or let the HEX field do it
                    }}
                  />
                </div>
                {errors.primary_color && <p className="text-xs text-red-600">{errors.primary_color.message}</p>}
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <Label htmlFor="logo_url">School Logo CDN Link</Label>
              <Input id="logo_url" {...register('logo_url')} placeholder="e.g. https://unilag.edu.ng/logo.png" />
              {errors.logo_url && <p className="text-xs text-red-600">{errors.logo_url.message}</p>}
            </div>

            <div className="border-t border-slate-100 my-4 pt-4" />

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">OCR & Matching Configuration</h3>
              
              {/* Allowed Banks */}
              <div className="space-y-1.5">
                <Label htmlFor="allowed_banks">Allowed Destination Banks (Comma-separated)</Label>
                <Input id="allowed_banks" {...register('allowed_banks')} placeholder="OPay, Moniepoint, GTBank, Zenith Bank" />
                {errors.allowed_banks && <p className="text-xs text-red-600">{errors.allowed_banks.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Auto Approve Threshold */}
                <div className="space-y-1.5">
                  <Label htmlFor="auto_approve_threshold">Auto-Approve Threshold (%)</Label>
                  <Input id="auto_approve_threshold" type="number" step="0.5" {...register('auto_approve_threshold')} />
                  {errors.auto_approve_threshold && <p className="text-xs text-red-600">{errors.auto_approve_threshold.message}</p>}
                </div>

                {/* Manual Review Threshold */}
                <div className="space-y-1.5">
                  <Label htmlFor="manual_review_threshold">Manual Review Threshold (%)</Label>
                  <Input id="manual_review_threshold" type="number" step="0.5" {...register('manual_review_threshold')} />
                  {errors.manual_review_threshold && <p className="text-xs text-red-600">{errors.manual_review_threshold.message}</p>}
                </div>
              </div>

              {/* Matric format */}
              <div className="space-y-1.5">
                <Label htmlFor="require_matric_format">Required Student Matriculation Pattern (Regex)</Label>
                <Input id="require_matric_format" {...register('require_matric_format')} placeholder="^[0-9]{9}$" />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Regex format to strictly filter matric inputs. E.g. University of Lagos might use 9 digits: `^[0-9]{9}$`.
                </p>
                {errors.require_matric_format && <p className="text-xs text-red-600">{errors.require_matric_format.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 mt-2"
            >
              {isSubmitting ? 'Onboarding Institution...' : 'Onboard & Instantiate Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
