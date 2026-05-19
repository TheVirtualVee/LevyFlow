'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, UserPlus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  entityType: z.enum(['lecturer', 'department', 'faculty', 'course_rep'], {
    errorMap: () => ({ message: 'Select your administrative role context' })
  }),
  institutionName: z.string().min(3, 'Enter the name of your university or polytechnic'),
  collectionName: z.string().min(2, 'e.g. Economics Dept, Dr. Adeyemi, or Faculty of Arts'),
  lecturerEmail: z.string().optional(),
  courseCode: z.string().optional()
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const selectedEntityType = watch('entityType')

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          setRegisteredEmail(values.email)
          setSuccessMessage('📧 Account already exists. Check your email for the confirmation link, then log in.')
          return
        }
        
        if (msg.includes('email not confirmed')) {
          setRegisteredEmail(values.email)
          setSuccessMessage('✅ Account created! Check your email to confirm, then log in.')
          return
        }
        
        setServerError(authError.message)
        return
      }

      if (!authData.user) {
        setServerError('User registration failed. Please try again.')
        return
      }

      const schoolName = `${values.institutionName} (${values.collectionName})`
      const schoolSlug = schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80) + '-' + Math.random().toString(36).substring(2, 6)

      const { data: newSchool, error: schoolErr } = await (supabase
        .from('schools') as any)
        .insert({
          name: schoolName,
          slug: schoolSlug,
          is_active: true
        })
        .select()
        .single()

      if (schoolErr || !newSchool) {
        setServerError(`Auth succeeded, but institution setup failed: ${schoolErr?.message}`)
        return
      }

      const school = newSchool as any

      let finalRole: string = 'host'
      if (values.entityType === 'faculty') {
        finalRole = 'school_admin'
      } else if (values.entityType === 'course_rep') {
        finalRole = 'course_rep'
      }

      let parentId: string | null = null
      if (values.entityType === 'course_rep' && values.lecturerEmail) {
        const { data: lecturerProfile } = await (supabase
          .from('user_profiles') as any)
          .select('id')
          .eq('email', values.lecturerEmail.trim())
          .single()
        
        if (lecturerProfile) {
          parentId = (lecturerProfile as any).id
        }
      }

      const { error: profileError } = await (supabase
        .from('user_profiles' as any) as any)
        .insert({
          id: authData.user.id,
          full_name: values.fullName,
          email: values.email,
          school_id: school.id,
          role: finalRole,
          parent_id: parentId,
          course_code: values.courseCode || null,
          is_approved: true
        })

      if (profileError) {
        const msg = profileError.message.toLowerCase()
        if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('unique constraint')) {
          setRegisteredEmail(values.email)
          setSuccessMessage('📧 Account already exists. Check your email for the confirmation link, then log in.')
          return
        }
        setServerError(`Auth succeeded, but profile creation failed: ${profileError.message}`)
        return
      }

      const { error: configError } = await (supabase
        .from('school_configs') as any)
        .insert({
          school_id: school.id,
          school_name_display: values.collectionName,
          primary_color: '#1E40AF'
        })

      if (configError) {
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      })

      if (signInError && signInError.message.toLowerCase().includes('email not confirmed')) {
        setRegisteredEmail(values.email)
        setSuccessMessage('✅ Check your email for confirmation link. Then log in.')
        return
      }

      setRegisteredEmail(values.email)
      setSuccessMessage('✅ Check your email for confirmation link. Then log in.')
      
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
            Administrative Onboarding Gate
          </p>
        </div>

        <Card className="glassmorphism-dark text-white border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white tracking-wide">Register Account</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Establish a lecturer, course representative, department, or faculty profile in under 30 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="space-y-6 py-4 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">ACCOUNT CREATED</h3>
                <div className="space-y-2 text-slate-300 text-sm">
                  <p>We've sent a confirmation link to:</p>
                  <p className="font-bold text-blue-400 text-lg">{registeredEmail}</p>
                </div>
                <p className="text-sm text-slate-400 px-4">
                  Click the link in the email to activate your account. Then you can log in.
                </p>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mt-6">
                  <p className="text-xs text-slate-400 mb-3">
                    📧 Didn't receive email? Check spam folder or click here to resend
                  </p>
                  <Button 
                    variant="outline" 
                    type="button"
                    className="w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    onClick={async () => {
                      if (registeredEmail) {
                        await supabase.auth.resend({
                          type: 'signup',
                          email: registeredEmail,
                          options: {
                            emailRedirectTo: `${window.location.origin}/auth/callback`
                          }
                        })
                        alert('Confirmation email resent!')
                      }
                    }}
                  >
                    Resend Email
                  </Button>
                </div>
                
                <div className="pt-4">
                  <Link href="/auth/login">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Your Full Name</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder="e.g. Dr. Adeyemi Alao"
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
                  placeholder="e.g. adeyemi@unilag.edu.ng"
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

              {/* Role Picker Context */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <Label htmlFor="entityType" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">I am collecting as a...</Label>
                <select
                  id="entityType"
                  {...register('entityType')}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800/50 text-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <option value="lecturer" className="text-slate-900">Individual Lecturer / Coordinator</option>
                  <option value="course_rep" className="text-slate-900">Course Representative (ECO 301, etc.)</option>
                  <option value="department" className="text-slate-900">Departmental Admin / Office</option>
                  <option value="faculty" className="text-slate-900">Faculty-Level Administrator</option>
                </select>
                {errors.entityType && (
                  <p className="text-xs text-rose-400 mt-1">{errors.entityType.message}</p>
                )}
              </div>

              {/* Course Representative Delegation Fields */}
              {selectedEntityType === 'course_rep' && (
                <div className="space-y-3.5 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in duration-300 text-left">
                  <div className="space-y-1.5">
                    <Label htmlFor="lecturerEmail" className="text-slate-300 font-semibold text-[10px] tracking-wider uppercase">Lecturer Email Address</Label>
                    <Input
                      id="lecturerEmail"
                      {...register('lecturerEmail')}
                      placeholder="e.g. adeyemi@unilag.edu.ng"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Linking your account lets your supervising lecturer oversee collections directly.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="courseCode" className="text-slate-300 font-semibold text-[10px] tracking-wider uppercase">Course Code / Class Section</Label>
                    <Input
                      id="courseCode"
                      {...register('courseCode')}
                      placeholder="e.g. ECO 301"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* University/Polytechnic Name */}
              <div className="space-y-1.5">
                <Label htmlFor="institutionName" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">University or Polytechnic</Label>
                <Input
                  id="institutionName"
                  {...register('institutionName')}
                  placeholder="e.g. University of Lagos"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
                {errors.institutionName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.institutionName.message}</p>
                )}
              </div>

              {/* Specific Collection Entity Name */}
              <div className="space-y-1.5">
                <Label htmlFor="collectionName" className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Specific Entity or Department Name</Label>
                <Input
                  id="collectionName"
                  {...register('collectionName')}
                  placeholder="e.g. Economics Dept or Dr. Adeyemi Dues"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-550 focus-visible:ring-blue-500"
                />
                {errors.collectionName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.collectionName.message}</p>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
