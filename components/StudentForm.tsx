'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { ShieldCheck, User, Users, Info } from 'lucide-react'

const formSchema = z.object({
  student_name: z.string().min(2, 'Full Name is required'),
  matric_number: z.string().min(5, 'Matric number is required'),
  contact_info: z.string().min(5, 'Phone number or email is required'),
  payer_name: z.string().optional(),
  relationship: z.string().optional(),
  screenshot: z.any()
    .refine((files) => files && files.length > 0, 'Screenshot image is required')
    .transform((files) => files[0] as File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    ).refine(
      (file) => ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type),
      'Only PNG, JPG, or WEBP images are allowed'
    )
})

type FormData = z.infer<typeof formSchema>

export function StudentForm({ campaign, onSubmit }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isThirdParty, setIsThirdParty] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('action', 'submit_payment')
    formData.append('student_name', data.student_name)
    formData.append('matric_number', data.matric_number)
    formData.append('contact_info', data.contact_info)
    formData.append('screenshot', data.screenshot)
    formData.append('campaign_id', campaign.id)
    
    if (isThirdParty) {
      formData.append('payer_name', data.payer_name || '')
      formData.append('relationship', data.relationship || '')
    } else {
      formData.append('payer_name', data.student_name)
      formData.append('relationship', 'self')
    }
    
    await onSubmit(formData)
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 text-slate-850 border border-slate-100 max-w-lg mx-auto">
      
      {/* Campaign Details Info Box */}
      <div className="mb-6 bg-slate-55/60 border border-slate-100 rounded-xl p-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> {campaign.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{campaign.description || 'Departmental Levy campaign portal active.'}</p>
        <div className="mt-3 flex justify-between items-center text-xs font-semibold bg-blue-50/70 text-blue-800 rounded-lg p-2.5 border border-blue-100/50">
          <span>Required Amount:</span>
          <span className="font-extrabold text-sm">₦{campaign.amount.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        
        {/* Payer Option Segmented Control */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Who made the payment transfer?</Label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsThirdParty(false)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isThirdParty 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" /> I paid for myself
            </button>
            <button
              type="button"
              onClick={() => setIsThirdParty(true)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isThirdParty 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Someone paid for me
            </button>
          </div>
        </div>

        {/* Student Details (Always Required) */}
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Student Details (Clearance Credit)</h4>
          
          <div>
            <Label htmlFor="student_name" className="text-slate-650 text-xs">Student Full Name</Label>
            <Input
              id="student_name"
              {...register('student_name')}
              placeholder="e.g. Adekunle Gold"
              className="mt-1"
            />
            {errors.student_name && (
              <p className="text-red-600 text-xs mt-1 font-semibold">{errors.student_name.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="matric_number" className="text-slate-650 text-xs">Matric Number</Label>
              <Input
                id="matric_number"
                {...register('matric_number')}
                placeholder="e.g. 2020/123456"
                className="mt-1 font-mono text-sm"
              />
              {errors.matric_number && (
                <p className="text-red-600 text-xs mt-1 font-semibold">{errors.matric_number.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_info" className="text-slate-650 text-xs">WhatsApp / Contact</Label>
              <Input
                id="contact_info"
                {...register('contact_info')}
                placeholder="e.g. 0803 123 4567"
                className="mt-1"
              />
              {errors.contact_info && (
                <p className="text-red-600 text-xs mt-1 font-semibold">{errors.contact_info.message as string}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payer Details (Shown conditionally if Someone else is paying is active) */}
        {isThirdParty && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
            <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-600" /> Payer Information (Sponsor)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payer_name" className="text-slate-650 text-xs">Payer Full Name</Label>
                <Input
                  id="payer_name"
                  {...register('payer_name')}
                  placeholder="e.g. Alhaji Musibau"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="relationship" className="text-slate-650 text-xs">Relationship / Sponsor Type</Label>
                <Input
                  id="relationship"
                  {...register('relationship')}
                  placeholder="e.g. Father / Aunt / Friend"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Upload Container */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <Label htmlFor="screenshot" className="text-slate-800 font-bold text-xs uppercase tracking-wider block">Upload Payment Screenshot</Label>
          <span className="text-[10px] text-slate-500 block leading-tight">Must clearly show the transferred amount is exactly ₦{campaign.amount.toLocaleString()}.</span>
          <Input
            id="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            {...register('screenshot')}
            className="mt-1 bg-white text-slate-900 border border-input rounded-md cursor-pointer hover:bg-slate-50"
          />
          {errors.screenshot && (
            <p className="text-red-600 text-xs mt-1 font-semibold">{errors.screenshot.message as string}</p>
          )}
        </div>

        {/* Action submit button */}
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Recording Transaction Details...' : 'Submit Payment Proof'}
        </Button>
      </form>

      {/* Destination Bank Account Information Display Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-600" /> Target Department Bank Account:
        </p>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block text-left w-full space-y-1">
          <p>Bank: <span className="font-extrabold text-slate-800">{campaign.bank_name}</span></p>
          <p>Account No: <span className="font-mono font-black text-slate-900 select-all">{campaign.account_number}</span></p>
          <p>Account Name: <span className="font-bold text-slate-800">{campaign.account_name}</span></p>
        </div>
        <div className="mt-3 text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2.5 border border-amber-100 leading-relaxed font-medium">
          ⚠️ <strong>Direct Payment Promise:</strong> Execute payment directly through your mobile banking application or POS agent. Upload the resulting transaction receipt above. LevyFlow does not hold or store student funds.
        </div>
      </div>
      
      <LegalDisclaimer variant="light" />
    </div>
  )
}
