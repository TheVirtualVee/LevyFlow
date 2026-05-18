import { NextRequest, NextResponse } from 'next/server'
import { archiveCampaign } from '@/lib/campaign/lifecycle'

/**
 * Endpoint to manually trigger campaign archiving and storage flushing from the host dashboard.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await archiveCampaign(params.id)
    return NextResponse.json({ success: true, report })
  } catch (err: any) {
    console.error(`Manual campaign archive failed for ${params.id}:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
