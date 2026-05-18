import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Users, XCircle, Loader2, RefreshCw } from 'lucide-react'

export function RegistrantManager({ campaignId }: { campaignId: string }) {
  const supabase = createClient()
  const [registrants, setRegistrants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRegistrants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('campaign_registrants')
        .select('id, student_name, matric_number, level, contact_info, access_token, token_uses_remaining, has_paid')
        .eq('campaign_id', campaignId)
        .order('student_name', { ascending: true })

      if (error) throw error
      setRegistrants(data as any[])
    } catch (e) {
      console.error('Failed to load registrants:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrants()
  }, [campaignId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRegistrants()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading registrants…
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase text-slate-700 tracking-wider">
          Registered Students ({registrants.length})
        </h3>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          disabled={refreshing}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1 text-left">Token</th>
              <th className="px-2 py-1 text-left">Student</th>
              <th className="px-2 py-1 text-left">Matric</th>
              <th className="px-2 py-1 text-left">Level</th>
              <th className="px-2 py-1 text-center">Paid?</th>
              <th className="px-2 py-1 text-center">Uses Left</th>
            </tr>
          </thead>
          <tbody>
            {registrants.map(r => (
              <tr key={r.id} className={r.has_paid ? 'bg-emerald-50' : ''}>
                <td className="px-2 py-1 font-mono text-slate-800">{r.access_token}</td>
                <td className="px-2 py-1 font-medium text-slate-900">{r.student_name}</td>
                <td className="px-2 py-1 font-mono text-slate-600">{r.matric_number}</td>
                <td className="px-2 py-1 text-slate-600">{r.level}</td>
                <td className="px-2 py-1 text-center">
                  {r.has_paid ? (
                    <Check className="w-4 h-4 text-emerald-600 inline-block" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-600 inline-block" />
                  )}
                </td>
                <td className="px-2 py-1 text-center text-slate-700">
                  {r.token_uses_remaining}/3
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        📌 Each token grants 3 access attempts. Tokens are tied to a single matric number and cannot be reused for other students.
      </p>
    </div>
  )
}
