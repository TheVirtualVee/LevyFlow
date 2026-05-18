import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const checks = {
    database: false,
    storage: false,
    timestamp: new Date().toISOString()
  }
  
  try {
    // Check database
    const { error: dbError } = await (supabaseAdmin.from('schools') as any).select('count', { count: 'exact', head: true })
    checks.database = !dbError
  } catch (err) {
    console.error('Health check db error:', err)
  }
  
  try {
    // Check storage
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    checks.storage = buckets?.some(b => b.name === 'payment-proofs') || false
  } catch (err) {
    console.error('Health check storage error:', err)
  }
  
  const allHealthy = checks.database && checks.storage
  
  return NextResponse.json(
    { status: allHealthy ? 'healthy' : 'degraded', ...checks },
    { status: allHealthy ? 200 : 503 }
  )
}
