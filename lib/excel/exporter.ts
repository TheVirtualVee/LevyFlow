import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateEvidenceQR } from '@/lib/qr/generator'
import crypto from 'crypto'

interface ExportOptions {
  campaignId: string
  includeQR: boolean
}

export async function generateCampaignExcel(options: ExportOptions) {
  const workbook = new ExcelJS.Workbook()
  
  // Fetch campaign data
  const { data: campaignData, error: campaignError } = await (supabaseAdmin
    .from('campaigns') as any)
    .select('*, host:host_id(full_name), school:school_id(name)')
    .eq('id', options.campaignId)
    .single()

  const campaign = campaignData as any

  if (campaignError || !campaign) {
    throw new Error(`Failed to fetch campaign: ${campaignError?.message}`)
  }
  
  // Fetch payment sessions
  const { data: sessionsData, error: sessionsError } = await (supabaseAdmin
    .from('payment_sessions') as any)
    .select('*')
    .eq('campaign_id', options.campaignId)
    .order('student_name', { ascending: true })

  const sessions = sessionsData as any[]

  if (sessionsError || !sessions) {
    throw new Error(`Failed to fetch payment sessions: ${sessionsError?.message}`)
  }

  // Fetch session statuses from view or derive them
  const { data: statuses } = await supabaseAdmin
    .from('payment_session_statuses' as any)
    .select('*')
    .eq('campaign_id', options.campaignId)

  const statusMap = new Map<string, any>()
  if (statuses) {
    statuses.forEach((s: any) => {
      statusMap.set(s.id, s)
    })
  }
  
  // Create worksheet
  const worksheet = workbook.addWorksheet('Reconciliation Ledger')
  
  // Add metadata header
  worksheet.addRow(['Campaign Title:', campaign.title])
  worksheet.addRow(['Host Name:', (campaign.host as any)?.full_name || 'N/A'])
  worksheet.addRow(['Account Details:', `${campaign.bank_name} - ${campaign.account_number} (${campaign.account_name})`])
  worksheet.addRow(['Deadline:', new Date(campaign.ends_at).toLocaleString()])
  worksheet.addRow(['Generated:', new Date().toLocaleString()])
  worksheet.addRow([])
  
  // Sort by disputed first, then student name
  const sortedSessions = [...sessions].sort((a, b) => {
    const statusA = statusMap.get(a.id)?.status || 'pending'
    const statusB = statusMap.get(b.id)?.status || 'pending'
    const isDispA = a.is_disputed || statusA === 'disputed' ? 1 : 0
    const isDispB = b.is_disputed || statusB === 'disputed' ? 1 : 0
    
    if (isDispB !== isDispA) {
      return isDispB - isDispA
    }
    return a.student_name.localeCompare(b.student_name)
  })

  // Add column headers
  const headers = [
    'S/N',
    'Student Name',
    'Matric Number',
    'Amount',
    'Status',
    'Manual Review Needed?',
    'Host Confirmation Action',
    'Receipt Reference Token',
    'Paid At',
    'Evidence QR'
  ]
  
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true }
  
  // Add data rows
  for (let index = 0; index < sortedSessions.length; index++) {
    const session = sortedSessions[index]
    const statusData = statusMap.get(session.id)
    const currentStatus = statusData?.status || 'pending'
    const isDisputed = session.is_disputed || currentStatus === 'disputed'

    const row = worksheet.addRow([
      index + 1,
      session.student_name,
      session.matric_number,
      campaign.amount,
      isDisputed ? 'Disputed' : currentStatus,
      isDisputed ? '⚠️ DISPUTED - Review Needed' : 'OK',
      '', // Host Confirmation Action column
      session.session_token || '',
      session.created_at ? new Date(session.created_at).toLocaleString() : '',
      '' // QR placeholder
    ])
    
    // Style disputed rows in yellow
    if (isDisputed) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' }
        }
        cell.font = { color: { argb: '000000' } }
      })
    } else {
      // Style regular confirmation action column (Column 7: Host Confirmation Action)
      const hostActionCell = row.getCell(7)
      hostActionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1F5F9' }
      }
    }
    
    if (options.includeQR && session.evidence_token && session.screenshot_url !== 'flushed') {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const qrBuffer = await generateEvidenceQR(
          `${appUrl}/evidence/${session.evidence_token}`
        )
        
        const imageId = workbook.addImage({
          buffer: qrBuffer as any,
          extension: 'png'
        })
        
        worksheet.addImage(imageId, {
          tl: { col: 9, row: row.number - 1 },
          ext: { width: 50, height: 50 }
        })
        row.height = 42
      } catch (qrErr) {
        console.error('Failed to generate QR for session:', session.id, qrErr)
      }
    }
  }

  // Add instruction block at bottom of list
  worksheet.addRow([])
  worksheet.addRow(['INSTRUCTIONS FOR RECONCILIATION:'])
  worksheet.addRow(['1. Only YELLOW rows require host attention / manual review.'])
  worksheet.addRow(['2. For each yellow row, verify in your bank app if the amount was received.'])
  worksheet.addRow(['3. Mark "Confirmed" or "Not Found" in the "Host Confirmation Action" column.'])
  worksheet.addRow(['4. Contact students whose payment is "Not Found".'])
  
  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Summary')
  
  const getCountByStatus = (status: string) => {
    return sessions.filter(s => {
      const sData = statusMap.get(s.id)
      return (sData?.status || 'pending') === status
    }).length
  }

  const verifiedCount = getCountByStatus('verified') + getCountByStatus('auto_verified')
  const disputedCount = sessions.filter(s => s.is_disputed || statusMap.get(s.id)?.status === 'disputed').length
  const hostApproved = getCountByStatus('host_approved')
  const hostRejected = getCountByStatus('host_rejected')
  
  summarySheet.addRow(['Campaign Summary'])
  summarySheet.addRow(['Required Amount:', campaign.amount])
  summarySheet.addRow(['Total Uploads:', sessions.length])
  summarySheet.addRow(['Verified Payments:', verifiedCount])
  summarySheet.addRow(['Disputed Payments:', disputedCount])
  summarySheet.addRow(['Host Approved Override:', hostApproved])
  summarySheet.addRow(['Host Rejected Override:', hostRejected])
  summarySheet.addRow(['Total Expected Amount:', sessions.length * campaign.amount])
  summarySheet.addRow(['Host Bank Amount:', ''])
  summarySheet.addRow(['Variance:', ''])
  
  // Generate verification hash
  const hash = await generateVerificationHash(campaign.id, sessions)
  summarySheet.addRow(['Verification Hash:', hash])
  
  return workbook
}

async function generateVerificationHash(campaignId: string, sessions: any[]): Promise<string> {
  const data = JSON.stringify({
    campaignId,
    sessions: sessions.map(s => ({
      id: s.id,
      name: s.student_name,
      matric: s.matric_number
    }))
  })
  return crypto.createHash('sha256').update(data).digest('hex')
}
