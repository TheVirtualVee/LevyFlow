import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
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

    if (!profile || !['host', 'school_admin', 'super_admin', 'validator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: sessionData } = await (supabaseAdmin
      .from('payment_sessions') as any)
      .select('*, campaign:campaign_id(*)')
      .eq('evidence_token', params.token)
      .single()

    const session = sessionData as any

    if (!session) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
    }

    if (profile.school_id !== session.school_id && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const forwardedFor = req.headers.get('x-forwarded-for') || ''
    const userAgent = req.headers.get('user-agent') || ''

    await (supabaseAdmin
      .from('audit_logs') as any)
      .insert({
        actor_id: user.id,
        action: 'view_evidence',
        entity_type: 'payment_session',
        entity_id: session.id,
        new_value: { evidence_token: params.token },
        ip_address: forwardedFor || null,
        user_agent: userAgent || null
      })

    const screenshotUrl = session.screenshot_url || ''
    const urlParts = screenshotUrl.split('/')
    const screenshotPath = urlParts.slice(urlParts.indexOf('payment-proofs') + 1).join('/')

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('payment-proofs')
      .createSignedUrl(screenshotPath, 300)

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json({ error: 'Failed to generate access URL' }, { status: 500 })
    }

    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
