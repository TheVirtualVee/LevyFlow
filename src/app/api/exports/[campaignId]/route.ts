import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateCampaignExcel } from '@/lib/excel/exporter'

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profileData } = await (supabaseAdmin
      .from('user_profiles') as any)
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    const profile = profileData as any

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: campaignData } = await (supabaseAdmin
      .from('campaigns') as any)
      .select('host_id, school_id')
      .eq('id', params.campaignId)
      .single()

    const campaign = campaignData as any

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const hasAccess = 
      profile.role === 'super_admin' ||
      profile.role === 'school_admin' ||
      (profile.role === 'host' && campaign.host_id === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const workbook = await generateCampaignExcel({
      campaignId: params.campaignId,
      includeQR: true
    })

    const buffer = await workbook.xlsx.writeBuffer()

    const forwardedFor = req.headers.get('x-forwarded-for') || ''
    const userAgent = req.headers.get('user-agent') || ''

    await (supabaseAdmin
      .from('audit_logs') as any)
      .insert({
        actor_id: user.id,
        action: 'export_excel',
        entity_type: 'campaign',
        entity_id: params.campaignId,
        ip_address: forwardedFor || null,
        user_agent: userAgent || null
      })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="campaign_${params.campaignId}_${Date.now()}.xlsx"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
