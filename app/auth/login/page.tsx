'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Shield } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      // Authenticate with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setServerError(error.message)
        return
      }

      // Check where to redirect
      const nextPath = searchParams.get('next') || '/campaigns'
      router.push(nextPath)
      router.refresh()
    } catch (e: any) {
      setServerError(e?.message || 'Login failed. Please try again.')
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
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            Levy<span className="text-blue-500">Flow</span>
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide uppercase">
            Administrative Verification Control Center
          </p>
        </div>

        <Card className="glassmorphism-dark text-white border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white tracking-wide">Sign In</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Enter your credential profile to manage institution ledgers.
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

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="admin@school.edu.ng"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-blue-500"
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
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 mt-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>

              <div className="text-center mt-4">
                <span className="text-xs text-slate-400">New host or admin? </span>
                <Link href="/auth/signup" className="text-xs font-bold text-blue-400 hover:text-blue-500 hover:underline">
                  Register Account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-slate-400 font-medium">Resolving Verification Session...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
