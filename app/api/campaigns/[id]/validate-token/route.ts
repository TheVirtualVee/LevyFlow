import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const tokenGateSchema = z.object({
  token: z
    .string()
    .length(4, 'Token must be exactly 4 digits.')
    .regex(/^\d+$/, 'Token must contain only numbers.')
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // Validate token format with Zod
    const parsed = tokenGateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, message: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token } = parsed.data

    // Execute atomic PL/pgSQL database verification with row locks
    const { data: rpcData, error: rpcErr } = await (supabaseAdmin as any).rpc(
      'validate_and_deduct_token',
      {
        token_input: token,
        campaign_id_input: params.id
      }
    )

    if (rpcErr) {
      console.error('Atomic token validation RPC failure:', rpcErr)
      return NextResponse.json(
        { valid: false, message: 'Database validation error.' },
        { status: 500 }
      )
    }

    const result = (rpcData as any) && ((rpcData as any)[0] as any)

    if (!result || !result.success) {
      return NextResponse.json({
        valid: false,
        message: result?.message || 'Access token validation failed.'
      })
    }

    // Fetch campaign details for the payment page
    const { data: campaignData } = await (supabaseAdmin
      .from('campaigns' as any) as any)
      .select('id, title, description, amount, bank_name, account_number, account_name, ends_at, share_link, school_id')
      .eq('id', params.id)
      .single()

    const campaign = campaignData as any

    if (!campaign) {
      return NextResponse.json({ valid: false, message: 'Campaign not found.' })
    }

    // Fetch any additional host accounts
    const { data: hostAccounts } = await (supabaseAdmin
      .from('host_accounts' as any) as any)
      .select('bank_name, account_number, account_name, is_primary')
      .eq('campaign_id', params.id)
      .order('is_primary', { ascending: false })

    return NextResponse.json({
      valid: true,
      registrant: {
        id: result.registrant_id,
        name: result.student_name,
        matric: result.matric_number,
        level: result.level,
        contact: result.contact_info
      },
      uses_remaining: result.uses_remaining,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        amount: campaign.amount,
        bank_name: campaign.bank_name,
        account_number: campaign.account_number,
        account_name: campaign.account_name,
        deadline: campaign.ends_at,
        share_link: campaign.share_link,
        school_id: campaign.school_id,
        host_accounts: (hostAccounts as any[]) || []
      }
    })
  } catch (err: any) {
    console.error('Token validation error:', err)
    return NextResponse.json(
      { valid: false, message: err.message || 'Server error.' },
      { status: 500 }
    )
  }
}
