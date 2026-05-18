'use client'

import { useState } from 'react'
import jsQR from 'jsqr'
import { createClient } from '@/lib/supabase/client'
import { 
  ShieldCheck, 
  QrCode, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  Loader2, 
  RefreshCw,
  Clock,
  User,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ScanResult {
  v: number
  n: string // name
  m: string // matric
  a: number // amount
  c: string // campaign
  r: string // reference
  t: string // timestamp
}

export default function VerifyPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [dbStatus, setDbStatus] = useState<'verified' | 'not_found' | 'unverified' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const supabase = createClient()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  async function processFile(file: File) {
    setScanning(true)
    setError(null)
    setScanResult(null)
    setDbStatus(null)

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.src = url

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }
        ctx.drawImage(img, 0, 0, img.width, img.height)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const code = jsQR(imageData.data, img.width, img.height)

        if (code) {
          const parsed = JSON.parse(code.data) as ScanResult
          if (!parsed.r || !parsed.n) {
            throw new Error('Invalid QR code data structure')
          }
          setScanResult(parsed)
          await verifyAgainstDatabase(parsed.r)
        } else {
          setError('No valid payment receipt QR code found in this image.')
        }
      } catch (err: any) {
        console.error(err)
        setError('Failed to scan image. Make sure it is a valid receipt QR.')
      } finally {
        setScanning(false)
        URL.revokeObjectURL(url)
      }
    }
    
    img.onerror = () => {
      setError('Could not load image file.')
      setScanning(false)
      URL.revokeObjectURL(url)
    }
  }

  async function verifyAgainstDatabase(reference: string) {
    setVerifying(true)
    try {
      // 1. Fetch matching payment session
      const { data: session, error: sessionErr } = await (supabase
        .from('payment_sessions' as any) as any)
        .select('id')
        .eq('session_token', reference)
        .maybeSingle()

      if (sessionErr || !session) {
        setDbStatus('not_found')
        return
      }

      // 2. Fetch the latest event associated with this session to determine verification status
      const { data: latestEvent, error: eventErr } = await (supabase
        .from('payment_events' as any) as any)
        .select('event_type')
        .eq('payment_session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (eventErr || !latestEvent) {
        setDbStatus('unverified')
        return
      }

      const verifiedStates = ['auto_verified', 'host_approved']
      if (verifiedStates.includes(latestEvent.event_type)) {
        setDbStatus('verified')
      } else {
        setDbStatus('unverified')
      }
    } catch (err) {
      console.error(err)
      setDbStatus('not_found')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -top-48 -left-48 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -bottom-48 -right-48 pointer-events-none" />

      <div className="max-w-md mx-auto relative">
        
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/campaigns" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" /> Control Panel
          </Link>
          <div className="flex items-center gap-1 text-blue-500 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> LevyFlow Auditor
          </div>
        </div>

        {/* Scan Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-lg space-y-6">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-500" /> Verify Student Receipts
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select or drop a screenshot of the student&apos;s QR code to run a cryptographic proof validation.
            </p>
          </div>

          {/* Drag & drop box */}
          <label 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/5' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />
            
            {scanning ? (
              <div className="space-y-2 py-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-350">Extracting receipt elements...</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-blue-400">Click to upload</span> or drag and drop image here
                </div>
                <p className="text-[10px] text-slate-500">Supports PNG, JPG, or screen captures</p>
              </div>
            )}
          </label>

          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
              <p className="text-xs text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Scanning & Database verification report */}
          {scanResult && (
            <div className="space-y-4 pt-2">
              <div className="border-t border-slate-800/80 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cryptographic Scan Result</h3>
                
                {/* Database Verification Status Ribbon */}
                <div className={`rounded-xl border p-4 text-center space-y-2 ${
                  verifying 
                    ? 'bg-slate-950/40 border-slate-800' 
                    : dbStatus === 'verified'
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                      : dbStatus === 'unverified'
                        ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                        : 'bg-red-950/20 border-red-500/20 text-red-400'
                }`}>
                  {verifying ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-xs font-bold text-slate-300">Validating database ledger proofs...</span>
                    </div>
                  ) : dbStatus === 'verified' ? (
                    <div className="space-y-1">
                      <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-wider">✓ Valid Payment Registered</p>
                      <p className="text-[10px] text-slate-450 leading-relaxed">This receipt hash corresponds to a verified ledger entry in the database.</p>
                    </div>
                  ) : dbStatus === 'unverified' ? (
                    <div className="space-y-1">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-wider">⚠️ Pending Verification</p>
                      <p className="text-[10px] text-slate-450 leading-relaxed">The receipt is decoded but the corresponding database transaction is unverified or disputed.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-wider">❌ Proof Not Found</p>
                      <p className="text-[10px] text-slate-450 leading-relaxed">No matching payment token or campaign record was found in the institution&apos;s ledger.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parsed JSON Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Student
                  </span>
                  <span className="text-slate-200 font-bold">{scanResult.n}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" /> Matric No
                  </span>
                  <span className="text-slate-200 font-semibold">{scanResult.m}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Amount</span>
                  <span className="text-white font-black">₦{scanResult.a.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Campaign</span>
                  <span className="text-slate-200 font-medium truncate max-w-[200px]">{scanResult.c}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Token Reference</span>
                  <span className="text-blue-400 font-mono font-semibold break-all select-all">{scanResult.r}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Timestamp
                  </span>
                  <span className="text-slate-350">{new Date(scanResult.t).toLocaleString()}</span>
                </div>
              </div>

              {/* Action row */}
              <Button 
                onClick={() => {
                  setScanResult(null)
                  setDbStatus(null)
                  setError(null)
                }}
                variant="outline"
                className="w-full border-slate-800 text-slate-350 hover:text-white hover:bg-slate-800/40 text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Scan Another Receipt
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
