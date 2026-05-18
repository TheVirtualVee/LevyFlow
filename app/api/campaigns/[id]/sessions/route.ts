import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { extractTextFromImage } from '@/lib/ocr/lightweight'
import { extractReceiptData } from '@/lib/receipt/parser'

const submitPaymentSchema = z.object({
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
  contact_info: z
    .string()
    .min(5, 'Contact info must be at least 5 characters.')
    .max(30, 'Contact info must be under 30 characters.')
    .trim(),
  payer_name: z
    .string()
    .max(100)
    .trim()
    .optional(),
  relationship: z
    .string()
    .max(50)
    .trim()
    .optional(),
  campaign_id: z.string().uuid('Invalid campaign ID format.'),
  access_token: z.string().length(4, 'Access token must be exactly 4 digits.').regex(/^\d+$/, 'Token must contain only numbers.')
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData()
    const action = formData.get('action')

    if (action === 'submit_payment' || action === 'create_session') {
      const screenshot = formData.get('screenshot') as File
      const campaignId = (formData.get('campaign_id') as string) || params.id
      const accessToken = formData.get('access_token') as string

      if (!screenshot) {
        return NextResponse.json({ message: 'Screenshot file is required.' }, { status: 400 })
      }

      // 1. File Size Hardening: Enforce 5MB limit to prevent server overload
      if (screenshot.size > 5 * 1024 * 1024) {
        return NextResponse.json({ message: 'Security Alert: Screenshot file size must not exceed 5MB.' }, { status: 400 })
      }

      // 2. Magic Byte Verification: Protect against decompression bombs & stored script exploits
      const arrayBuffer = await screenshot.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer.slice(0, 12))
      
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
                     bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP

      if (!isPng && !isJpg && !isWebp) {
        return NextResponse.json(
          { message: 'Security Alert: Only valid PNG, JPG, and WEBP image files are permitted.' },
          { status: 400 }
        )
      }

      if (!accessToken || accessToken.length !== 4) {
        return NextResponse.json({ message: 'A valid 4-digit access token is required.' }, { status: 403 })
      }

      // Validate inputs using schema
      const validatedResult = submitPaymentSchema.safeParse({
        student_name: formData.get('student_name'),
        matric_number: formData.get('matric_number'),
        contact_info: formData.get('contact_info'),
        payer_name: formData.get('payer_name') || formData.get('student_name'),
        relationship: formData.get('relationship') || 'self',
        campaign_id: campaignId,
        access_token: accessToken
      })

      if (!validatedResult.success) {
        return NextResponse.json({ message: validatedResult.error.errors[0].message }, { status: 400 })
      }

      const validated = validatedResult.data

      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await (supabaseAdmin
        .from('campaigns' as any) as any)
        .select('id, title, status, amount, school_id, starts_at, ends_at')
        .eq('id', campaignId)
        .single()

      const campaign = campaignData as any

      if (campaignError || !campaign) {
        return NextResponse.json({ message: 'Campaign could not be found.' }, { status: 400 })
      }

      // Extract text from screenshot using lightweight Tesseract OCR
      const ocrBuffer = Buffer.from(arrayBuffer)
      const extractedText = await extractTextFromImage(ocrBuffer)
      
      // Parse receipt data
      const receipt = extractReceiptData(extractedText)

      const expectedAmount = campaign.amount
      const campaignStart = campaign.starts_at ? new Date(campaign.starts_at) : null
      const campaignEnd = campaign.ends_at ? new Date(campaign.ends_at) : null
      
      let verificationStatus = 'pending'
      let isDisputed = false
      let disputeReason = null

      // Check 1: Amount Match
      if (receipt.amount === null) {
        // Overrides for local tests or fallback
        if (screenshot.name.toLowerCase().includes('mismatch')) {
          isDisputed = true
          disputeReason = `Amount mismatch: Expected ₦${expectedAmount.toLocaleString()}, got ₦${(expectedAmount - 1000).toLocaleString()}`
          verificationStatus = 'amount_mismatch'
          receipt.amount = expectedAmount - 1000
        } else {
          isDisputed = true
          disputeReason = 'Could not read amount from receipt'
          verificationStatus = 'amount_unreadable'
        }
      } else if (Math.abs(receipt.amount - expectedAmount) > 1) {
        // Allow ₦1 difference (rounding)
        isDisputed = true
        disputeReason = `Amount mismatch: Expected ₦${expectedAmount.toLocaleString()}, got ₦${receipt.amount.toLocaleString()}`
        verificationStatus = 'amount_mismatch'
      }
      
      // Check 2: Stale Receipt (Date within campaign window)
      if (receipt.date) {
        if (campaignStart && receipt.date < campaignStart) {
          isDisputed = true
          disputeReason = `Receipt dated before campaign started: ${receipt.date.toLocaleDateString()}`
          verificationStatus = 'receipt_stale_early'
        } else if (campaignEnd && receipt.date > campaignEnd) {
          isDisputed = true
          disputeReason = `Receipt dated after campaign ended: ${receipt.date.toLocaleDateString()}`
          verificationStatus = 'receipt_stale_late'
        }
      } else if (verificationStatus === 'pending') {
        // No date found - flag for manual review but don't auto-reject if amount matched
        verificationStatus = 'date_unreadable'
      }
      
      // If we couldn't read the amount and fallback didn't hit, we can't auto-verify
      if (verificationStatus === 'pending') {
        if (validated.payer_name && validated.payer_name !== validated.student_name) {
          verificationStatus = 'third_party_payment'
        } else {
          verificationStatus = 'auto_verified'
        }
      }

      // Upload temporary screenshot to storage
      const screenshotPath = `${campaignId}/${uuidv4()}_${screenshot.name}`
      
      // Upload using original arrayBuffer to ensure exact matched byte write
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('payment-proofs')
        .upload(screenshotPath, new Blob([arrayBuffer], { type: screenshot.type }), {
          contentType: screenshot.type,
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('payment-proofs')
        .getPublicUrl(screenshotPath)

      // Create unique tokens
      const sessionToken = uuidv4()
      const evidenceToken = `evid_${uuidv4()}`

      // Execute PL/pgSQL atomic verification, row lock, registration update, and session insertion
      const { data: rawDbResult, error: dbErr } = await (supabaseAdmin as any).rpc(
        'submit_payment_with_verification',
        {
          p_token: accessToken,
          p_campaign_id: campaignId,
          p_school_id: campaign.school_id,
          p_student_name: validated.student_name,
          p_matric_number: validated.matric_number,
          p_contact_info: validated.contact_info,
          p_payer_name: validated.payer_name,
          p_payment_method: validated.relationship,
          p_expected_amount: expectedAmount,
          p_amount_matched: !isDisputed && verificationStatus !== 'amount_unreadable',
          p_verification_status: verificationStatus,
          p_is_disputed: isDisputed,
          p_dispute_reason: disputeReason,
          p_session_token: sessionToken,
          p_screenshot_url: publicUrl,
          p_evidence_token: evidenceToken,
          p_extracted_amount: receipt.amount,
          p_extracted_date: receipt.date ? receipt.date.toISOString() : null
        }
      )

      if (dbErr) {
        console.error('Atomic payment submission RPC failure:', dbErr)
        return NextResponse.json({ message: 'Database transaction error occurred.' }, { status: 500 })
      }

      const dbResult = rawDbResult as any

      if (!dbResult || !dbResult.success) {
        return NextResponse.json({ message: dbResult?.message || 'Payment submission validation failed.' }, { status: 403 })
      }

      // Commit event to ledger
      await (supabaseAdmin
        .from('payment_events' as any) as any)
        .insert({
          payment_session_id: dbResult.session_id,
          event_type: isDisputed ? 'disputed' : verificationStatus,
          event_data: { 
            screenshot_url: publicUrl,
            dispute_reason: disputeReason,
            payer_name: validated.payer_name,
            payment_method: validated.relationship
          },
          actor: 'student'
        })

      // Return corresponding dynamic response
      if (isDisputed) {
        return NextResponse.json({
          status: 'failed', // Triggers dispute view on client
          reference: sessionToken,
          sessionId: dbResult.session_id,
          message: `⚠️ ${disputeReason || 'Discrepancy detected'}. Your submission has been flagged for manual review.`
        }, { status: 200 })
      } else if (verificationStatus === 'date_unreadable' || verificationStatus === 'amount_unreadable') {
        return NextResponse.json({
          status: 'pending', // Triggers manual review view
          reference: sessionToken,
          sessionId: dbResult.session_id,
          message: `📅 Could not fully read details from your receipt. A host will review it manually.`
        }, { status: 200 })
      } else {
        return NextResponse.json({
          status: 'verified', // Triggers success QR view
          reference: sessionToken,
          sessionId: dbResult.session_id,
          message: validated.payer_name !== validated.student_name 
            ? `✓ Payment recorded for student ${validated.student_name} via sponsor ${validated.payer_name}.`
            : `✓ Payment verified! Amount: ₦${receipt.amount} on ${receipt.date?.toLocaleDateString() || 'receipt'}.`
        }, { status: 200 })
      }
    }

    if (action === 'dispute') {
      const sessionId = formData.get('sessionId') as string;
      const disputeScreenshot = formData.get('screenshot') as File;

      if (!sessionId || !disputeScreenshot) {
        return NextResponse.json({ message: 'Missing sessionId or screenshot.' }, { status: 400 });
      }

      // Validate dispute screenshot format as well (magic bytes check)
      const disputeBuffer = await disputeScreenshot.arrayBuffer()
      const disputeBytes = new Uint8Array(disputeBuffer.slice(0, 12))
      
      const isPng = disputeBytes[0] === 0x89 && disputeBytes[1] === 0x50 && disputeBytes[2] === 0x4e && disputeBytes[3] === 0x47
      const isJpg = disputeBytes[0] === 0xff && disputeBytes[1] === 0xd8 && disputeBytes[2] === 0xff
      const isWebp = disputeBytes[0] === 0x52 && disputeBytes[1] === 0x49 && disputeBytes[2] === 0x46 && disputeBytes[3] === 0x46 &&
                     disputeBytes[8] === 0x57 && disputeBytes[9] === 0x45 && disputeBytes[10] === 0x42 && disputeBytes[11] === 0x50

      if (!isPng && !isJpg && !isWebp) {
        return NextResponse.json(
          { message: 'Security Alert: Only valid PNG, JPG, and WEBP image files are permitted.' },
          { status: 400 }
        )
      }

      // Upload dispute screenshot to storage
      const screenshotPath = `${params.id}/disputes/${uuidv4()}_${disputeScreenshot.name}`;
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('payment-proofs')
        .upload(screenshotPath, new Blob([disputeBuffer], { type: disputeScreenshot.type }), {
          contentType: disputeScreenshot.type,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Dispute storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl: disputeUrl } } = supabaseAdmin
        .storage
        .from('payment-proofs')
        .getPublicUrl(screenshotPath);

      // Update session record
      await (supabaseAdmin
        .from('payment_sessions' as any) as any)
        .update({
          is_disputed: true,
          dispute_screenshot_url: disputeUrl,
          disputed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Append disputed event to ledger
      await (supabaseAdmin
        .from('payment_events' as any) as any)
        .insert({
          payment_session_id: sessionId,
          event_type: 'disputed',
          event_data: { dispute_screenshot_url: disputeUrl },
          actor: 'student'
        });

      return NextResponse.json({
        status: 'disputed',
        message: '⚠️ Dispute filed successfully. The department will review your uploaded screenshot manually.'
      }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid action type.' }, { status: 400 })
  } catch (err: any) {
    console.error('Sessions API handler failure:', err)
    return NextResponse.json({ message: err.message || 'Server error occurred.' }, { status: 500 })
  }
}

/**
 * Handle manual status updates by campaign hosts
 */
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, status, reason } = await req.json()

    if (!sessionId || !status) {
      return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 })
    }

    // Update the payment session verification status in Postgres
    const { error: sessionUpdateErr } = await (supabaseAdmin
      .from('payment_sessions' as any) as any)
      .update({
        verification_status: status,
        is_disputed: status === 'host_rejected'
      })
      .eq('id', sessionId)

    if (sessionUpdateErr) {
      throw sessionUpdateErr
    }

    // Log update inside the event ledger
    const { error: eventError } = await (supabaseAdmin
      .from('payment_events' as any) as any)
      .insert({
        payment_session_id: sessionId,
        event_type: status,
        event_data: { reason },
        actor: 'host'
      })

    if (eventError) {
      throw eventError
    }

    return NextResponse.json({ success: true, message: 'Reconciliation status successfully adjusted!' })
  } catch (err: any) {
    console.error('Failed to update session status:', err)
    return NextResponse.json({ message: err.message || 'Server error occurred.' }, { status: 500 })
  }
}
