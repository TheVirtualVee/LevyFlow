'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Check, 
  X, 
  Eye, 
  EyeOff,
  User,
  Users
} from 'lucide-react'

interface ReconciliationTableProps {
  sessions: any[]
  campaignId: string
  onStatusUpdated: () => void
}

export function ReconciliationTable({ 
  sessions, 
  campaignId, 
  onStatusUpdated 
}: ReconciliationTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleAction = async (sessionId: string, newStatus: 'host_approved' | 'host_rejected', reason: string) => {
    setUpdatingId(sessionId)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/sessions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: newStatus,
          reason
        })
      })

      if (response.ok) {
        onStatusUpdated()
      } else {
        const errData = await response.json()
        alert(`Failed to update status: ${errData.message || 'Unknown error'}`)
      }
    } catch (e) {
      console.error(e)
      alert('Error updating status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <Table id="ledger-table">
        <TableHeader className="bg-slate-50 border-b border-slate-200 no-print">
          <TableRow>
            <TableHead className="font-bold text-slate-700 w-12">S/N</TableHead>
            <TableHead className="font-bold text-slate-700">Student Name</TableHead>
            <TableHead className="font-bold text-slate-700">Matric No</TableHead>
            <TableHead className="font-bold text-slate-700">Payer</TableHead>
            <TableHead className="font-bold text-slate-700 text-right">Amount</TableHead>
            <TableHead className="font-bold text-slate-700">Status</TableHead>
            <TableHead className="font-bold text-slate-700">Dispute Reason</TableHead>
            <TableHead className="font-bold text-slate-700 text-right no-print">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500 font-medium">
                No payment proofs submitted yet for this campaign.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session, idx) => {
              const currentStatus = session.verification_status || session.status || 'pending'
              const isDisputed = session.is_disputed || currentStatus === 'amount_mismatch' || currentStatus === 'disputed'
              const isThirdParty = currentStatus === 'third_party_payment'
              const isFlushed = session.screenshot_url === 'flushed'

              // Determine row background color mapping
              let rowStyle = 'hover:bg-slate-50'
              if (isDisputed) {
                rowStyle = 'bg-red-50 hover:bg-red-100/80 border-l-2 border-l-rose-500 highlight-red'
              } else if (isThirdParty) {
                rowStyle = 'bg-amber-50/70 hover:bg-amber-100/70 border-l-2 border-l-amber-500 highlight-yellow'
              }

              return (
                <TableRow 
                  key={session.id} 
                  className={`transition-colors border-t border-slate-100 ${rowStyle}`}
                >
                  {/* S/N */}
                  <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>

                  {/* Student Name */}
                  <TableCell>
                    <div className="font-semibold text-slate-900 leading-tight">{session.student_name}</div>
                    {session.contact_info && (
                      <div className="text-[10px] text-slate-400 mt-0.5 no-print">{session.contact_info}</div>
                    )}
                  </TableCell>

                  {/* Matric No */}
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">{session.matric_number}</TableCell>

                  {/* Payer */}
                  <TableCell>
                    {session.payer_name && session.payer_name !== session.student_name ? (
                      <span className="flex items-center gap-1 text-xs text-slate-800 font-medium">
                        <Users className="w-3.5 h-3.5 text-blue-500 shrink-0 no-print" /> 
                        <span className="truncate max-w-[130px]">{session.payer_name}</span>
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">({session.payment_method || 'Sponsor'})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-300 shrink-0 no-print" /> Self
                      </span>
                    )}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right font-bold text-slate-950">
                    ₦{Number(session.amount || 0).toLocaleString()}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {isDisputed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                        ⚠️ Manual Review
                      </span>
                    ) : isThirdParty ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        🟡 Third Party
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Verified
                      </span>
                    )}
                  </TableCell>

                  {/* Dispute Reason */}
                  <TableCell className="max-w-[200px]">
                    {session.is_disputed && session.dispute_reason && (
                      <div className="text-xs text-red-600 font-semibold leading-tight no-print">
                        {session.dispute_reason}
                      </div>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Screenshot (Only if not flushed) */}
                      {isFlushed ? (
                        <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-slate-100 rounded px-1.5 py-0.5 select-none text-slate-400" title="Screenshots deleted to preserve space and security">
                          <EyeOff className="w-3 h-3 text-slate-400" /> Flushed
                        </div>
                      ) : (
                        session.evidence_token && (
                          <a 
                            href={`/api/evidence/${session.evidence_token}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                            title="View screenshot proof"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )
                      )}

                      {/* Manual Verification Approve */}
                      {(isThirdParty || isDisputed || currentStatus === 'pending') && (
                        <button
                          onClick={() => handleAction(session.id, 'host_approved', 'Verified manually by host.')}
                          disabled={updatingId !== null}
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
                          title="Confirm Found & Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Manual Verification Reject */}
                      {(isThirdParty || isDisputed || currentStatus === 'pending') && (
                        <button
                          onClick={() => handleAction(session.id, 'host_rejected', 'Rejected manually by host.')}
                          disabled={updatingId !== null}
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
                          title="Flag as Invalid / Not Found"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
