// src/app/api/cron/expire-campaigns/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    // Validate authorization header against Vercel CRON_SECRET for security
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bulk transition active campaigns that passed their deadline to expired state
    const { data, error } = await (supabaseAdmin
      .from('campaigns' as any) as any)
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('ends_at', new Date().toISOString())
      .select('id, title, ends_at')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Auto-expired ${data?.length || 0} active campaign(s) successfully!`,
      expiredCount: data?.length || 0,
      campaigns: data
    })
  } catch (err: any) {
    console.error('Campaign expiry cron failed:', err)
    return NextResponse.json({ error: err.message || 'Cron execution error.' }, { status: 500 })
  }
}
