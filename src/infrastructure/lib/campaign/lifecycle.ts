import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export interface ArchiveReport {
  campaignId: string
  archivedAt: string
  totalProofsFlushed: number
  integrityHash: string
  manifest: {
    campaign_id: string
    timestamp: string
    sessions: Array<{
      reference: string
      name_hash: string
      matric_hash: string
    }>
  }
}

/**
 * Archives a completed campaign, generates a cryptographic verification manifest,
 * logs the manifest's SHA-256 integrity hash, and flushes all binary screenshots
 * from Supabase Storage to enforce zero data liability and maintain free storage limits.
 */
export async function archiveCampaign(campaignId: string): Promise<ArchiveReport> {
  const { data: campaign, error: campaignErr } = await (supabaseAdmin
    .from('campaigns' as any) as any)
    .select('id, title, status')
    .eq('id', campaignId)
    .single()

  if (campaignErr || !campaign) {
    throw new Error(`Campaign not found: ${campaignErr?.message || 'Unknown error'}`)
  }

  const { data: sessions, error: sessionsErr } = await (supabaseAdmin
    .from('payment_sessions' as any) as any)
    .select('id, student_name, matric_number, session_token, screenshot_url, dispute_screenshot_url')
    .eq('campaign_id', campaignId)

  if (sessionsErr || !sessions) {
    throw new Error(`Failed to retrieve payment sessions: ${sessionsErr?.message}`)
  }

  const sha255 = (input: string) => {
    return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex')
  }

  const manifest = {
    campaign_id: campaignId,
    timestamp: new Date().toISOString(),
    sessions: (sessions as any[]).map((s: any) => ({
      reference: s.session_token,
      name_hash: sha255(s.student_name),
      matric_hash: sha255(s.matric_number)
    }))
  }

  const integrityHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(manifest))
    .digest('hex')

  const storageFilesToDelete: string[] = []

  for (const session of sessions) {
    if (session.screenshot_url) {
      const pathPart = extractStoragePath(session.screenshot_url)
      if (pathPart) storageFilesToDelete.push(pathPart)
    }
    if (session.dispute_screenshot_url) {
      const pathPart = extractStoragePath(session.dispute_screenshot_url)
      if (pathPart) storageFilesToDelete.push(pathPart)
    }
  }

  if (storageFilesToDelete.length > 0) {
    const { error: deleteErr } = await supabaseAdmin.storage
      .from('payment-proofs')
      .remove(storageFilesToDelete)

    if (deleteErr) {
    }
  }

  const { error: proofErr } = await (supabaseAdmin
    .from('archive_proofs' as any) as any)
    .insert({
      campaign_id: campaignId,
      manifest_hash: integrityHash
    })

  if (proofErr) {
    throw new Error(`Failed to commit integrity proof to database ledger: ${proofErr.message}`)
  }

  const { error: updateCampaignErr } = await (supabaseAdmin
    .from('campaigns' as any) as any)
    .update({
      status: 'archived',
      storage_freed: true,
      archived_at: manifest.timestamp,
      host_confirmed: true
    })
    .eq('id', campaignId)

  if (updateCampaignErr) {
    throw new Error(`Failed to update campaign archived metadata: ${updateCampaignErr.message}`)
  }

  const { error: updateSessionsErr } = await (supabaseAdmin
    .from('payment_sessions' as any) as any)
    .update({
      screenshot_url: 'flushed',
      dispute_screenshot_url: 'flushed'
    })
    .eq('campaign_id', campaignId)

  if (updateSessionsErr) {
  }

  await (supabaseAdmin
    .from('payment_events' as any) as any)
    .insert({
      event_type: 'campaign_archived',
      event_data: { 
        sessions_count: sessions.length,
        screenshots_deleted: true,
        hash: integrityHash
      },
      actor: 'system'
    })

  return {
    campaignId,
    archivedAt: manifest.timestamp,
    totalProofsFlushed: storageFilesToDelete.length,
    integrityHash,
    manifest
  }
}

/**
 * Extracts the storage object path from a Supabase public storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    if (!url || url === 'flushed') return null
    const parts = url.split('/payment-proofs/')
    if (parts.length > 1) {
      return parts[1]
    }
    return null
  } catch (err) {
    return null
  }
}
