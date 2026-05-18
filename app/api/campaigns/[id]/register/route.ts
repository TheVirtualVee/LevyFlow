import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  student_name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be under 100 characters.')
    .trim(),
  matric_number: z
    .string()
    .min(5, 'Matric number must be at least 5 characters.')
    .max(50, 'Matric number must be under 50 characters.')
    .trim()
    .regex(/^[A-Za-z0-9\/\-]+$/, 'Invalid characters in matric number.'),
  level: z
    .string()
    .min(1, 'Level is required.')
    .max(10, 'Level is too long.')
    .trim(),
  contact_info: z
    .string()
    .max(30, 'Contact info is too long.')
    .trim()
    .optional()
    .nullable()
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    
    // Validate inputs
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { student_name, matric_number, level, contact_info } = parsed.data

    // Verify campaign exists and is active
    const { data: campaignData, error: campaignErr } = await (supabaseAdmin
      .from('campaigns' as any) as any)
      .select('id, title, status')
      .eq('id', params.id)
      .single()

    const campaign = campaignData as any

    if (campaignErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }

    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'This campaign is no longer accepting registrations.' },
        { status: 400 }
      )
    }

    // Check if matric already registered for this campaign
    const { data: existing } = await (supabaseAdmin
      .from('campaign_registrants' as any) as any)
      .select('id, access_token')
      .eq('campaign_id', params.id)
      .eq('matric_number', matric_number)
      .maybeSingle()

    if (existing) {
      // Return existing token so student can recover it
      return NextResponse.json({
        success: true,
        token: (existing as any).access_token,
        message: 'Already registered! Here is your existing token.',
        existing: true
      })
    }

    // Generate unique 4-digit token within this campaign
    let accessToken = ''
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 20) {
      accessToken = Math.floor(1000 + Math.random() * 9000).toString()

      const { data: tokenCheck } = await (supabaseAdmin
        .from('campaign_registrants' as any) as any)
        .select('id')
        .eq('campaign_id', params.id)
        .eq('access_token', accessToken)
        .maybeSingle()

      if (!tokenCheck) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Could not generate unique token. Try again.' },
        { status: 500 }
      )
    }

    // Insert registrant
    const { data: registrant, error: insertErr } = await (supabaseAdmin
      .from('campaign_registrants' as any) as any)
      .insert({
        campaign_id: params.id,
        student_name: student_name,
        matric_number: matric_number,
        level: level,
        contact_info: contact_info || null,
        access_token: accessToken,
        token_uses_remaining: 3
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Registration insert error:', insertErr)

      // Handle unique constraint violation gracefully
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'This matric number is already registered for this campaign.' },
          { status: 409 }
        )
      }

      throw insertErr
    }

    return NextResponse.json({
      success: true,
      token: accessToken,
      message: 'Registration successful! Save your 4-digit access token.',
      existing: false
    })
  } catch (err: any) {
    console.error('Registration API error:', err)
    return NextResponse.json(
      { error: err.message || 'Server error.' },
      { status: 500 }
    )
  }
}
