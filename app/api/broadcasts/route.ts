import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const broadcastSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID').optional().nullable(),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  severity: z.enum(['info', 'warning', 'success', 'deadline']).default('info'),
  expires_hours: z.number().min(1).max(168).default(24) // Max 7 days
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized. Host authentication required.' }, { status: 401 })
    }

    const body = await req.json()
    const validatedResult = broadcastSchema.safeParse(body)

    if (!validatedResult.success) {
      return NextResponse.json({ message: validatedResult.error.errors[0].message }, { status: 400 })
    }

    const { campaign_id, message, severity, expires_hours } = validatedResult.data

    // If a campaign ID is provided, verify the host owns it
    if (campaign_id) {
      const { data: campaign, error: accessError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaign_id)
        .single()

      if (accessError || !campaign) {
        return NextResponse.json({ message: 'Campaign not found or access denied.' }, { status: 403 })
      }
    }

    // Write to broadcast ledger
    const endsAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000)

    const { data: broadcast, error: insertError } = await (supabaseAdmin
      .from('broadcast_messages' as any) as any)
      .insert({
        campaign_id: campaign_id || null,
        message,
        severity,
        active: true,
        ends_at: endsAt.toISOString(),
        created_by: session.user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Broadcast insertion error:', insertError)
      return NextResponse.json({ message: 'Failed to deploy broadcast.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, broadcast }, { status: 201 })
  } catch (err: any) {
    console.error('Broadcast API error:', err)
    return NextResponse.json({ message: 'Server error occurred while executing broadcast.' }, { status: 500 })
  }
}
