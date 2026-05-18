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
import { AlertCircle, Shield, UserPlus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  schoolId: z.string().optional().nullable(),
  onboardNewSchool: z.boolean().default(false)
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [schools, setSchools] = useState<any[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onboardNewSchoolValue = watch('onboardNewSchool')

  useEffect(() => {
    async function loadSchools() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
        
        if (!error && data) {
          setSchools(data)
        }
      } catch (e) {
        console.error('Failed to load schools:', e)
      } finally {
        setLoadingSchools(false)
      }
    }
    loadSchools()
  }, [supabase])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName
          }
        }
      })

      if (authError) {
        setServerError(authError.message)
        return
      }

      if (!authData.user) {
        setServerError('User registration failed. Please try again.')
        return
      }

      // Determine appropriate role and school_id
      const finalSchoolId = values.onboardNewSchool ? null : (values.schoolId || null)
      const finalRole = finalSchoolId ? 'host' : 'school_admin'

      // 2. Insert into user_profiles table (approved by default for prototyping convenience)
      const { error: profileError } = await (supabase
        .from('user_profiles' as any) as any)
        .insert({
          id: authData.user.id,
          full_name: values.fullName,
          email: values.email,
          school_id: finalSchoolId,
          role: finalRole,
          is_approved: true
        })

      if (profileError) {
        console.error('Profile insertion error:', profileError)
        setServerError(`Auth succeeded, but profile creation failed: ${profileError.message}`)
        return
      }

      // 3. Authenticate user session
      await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      })

      // 4. Redirect based on school configuration
      if (finalSchoolId) {
        router.push('/campaigns')
      } else {
        // Must onboard new school first
        router.push('/admin/schools/onboard')
      }
      router.refresh()
    } catch (e: any) {
      setServerError(e?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/30 to-indigo-900/30 -z-10" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -top-48 -left-48 -z-10" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -bottom-48 -right-48 -z-10" />

      <div className="max-w-md w-full">
        {/* LevyFlow Brand Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg backdrop-blur-md">
            <UserPlus className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            Levy<span className="text-blue-500">Flow</span>
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide uppercase">
            Administrative Registration Gate
          </p>
        </div>

        <Card className="glassmorphism-dark text-white border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white tracking-wide">Register Account</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Create an administrator profile to deploy payment campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Full Name</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder="Dr. Adeyemi Alao"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="admin@school.edu.ng"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Account Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* School Association */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="onboardNewSchool"
                    {...register('onboardNewSchool')}
                    className="w-4 h-4 rounded border-slate-750 text-blue-600 focus:ring-blue-500/20"
                  />
                  <Label htmlFor="onboardNewSchool" className="text-slate-300 font-semibold text-xs tracking-wider uppercase cursor-pointer">
                    Onboard a new school/department
                  </Label>
                </div>

                {!onboardNewSchoolValue && (
                  <div className="space-y-1.5 transition-all">
                    <Label htmlFor="schoolId" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Associate with Existing School</Label>
                    <select
                      id="schoolId"
                      {...register('schoolId')}
                      className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800/50 text-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      disabled={loadingSchools || schools.length === 0}
                    >
                      {loadingSchools ? (
                        <option>Loading schools...</option>
                      ) : schools.length === 0 ? (
                        <option>No schools active. Please onboard one.</option>
                      ) : (
                        <>
                          <option value="">Select school association</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id} className="text-slate-900">
                              {school.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 mt-2 rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center mt-4">
                <span className="text-xs text-slate-400">Already registered? </span>
                <Link href="/auth/login" className="text-xs font-bold text-blue-400 hover:text-blue-500 hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
