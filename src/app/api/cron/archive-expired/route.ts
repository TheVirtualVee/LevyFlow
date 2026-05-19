import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { archiveCampaign } from '@/lib/campaign/lifecycle'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron Job Route handler to fetch expired campaigns past their
 * 7-day dispute window, generating and signing proofs, then purging raw images.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: campaigns, error: campaignErr } = await (supabaseAdmin
      .from('campaigns' as any) as any)
      .select('id, title')
      .neq('status', 'archived')
      .lt('ends_at', sevenDaysAgo.toISOString())

    if (campaignErr) {
      throw new Error(`Failed to query expired campaigns: ${campaignErr.message}`)
    }

    const archivedCampaigns = []

    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        try {
          const report = await archiveCampaign(campaign.id)
          archivedCampaigns.push({
            id: campaign.id,
            title: campaign.title,
            flushedProofsCount: report.totalProofsFlushed,
            manifestHash: report.integrityHash
          })
        } catch (archiveErr: any) {
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: campaigns?.length || 0,
      archived: archivedCampaigns
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
