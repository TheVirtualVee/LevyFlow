'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

interface PaymentReceiptQRProps {
  studentName: string
  matricNumber: string
  amount: number
  campaignTitle: string
  reference: string
  timestamp: string
}

export function PaymentReceiptQR({ 
  studentName, 
  matricNumber, 
  amount, 
  campaignTitle,
  reference,
  timestamp 
}: PaymentReceiptQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  const paymentData = {
    v: 1,
    n: studentName,
    m: matricNumber,
    a: amount,
    c: campaignTitle,
    r: reference,
    t: timestamp
  }

  useEffect(() => {
    QRCode.toDataURL(JSON.stringify(paymentData), {
      width: 250,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(setQrDataUrl)
  }, [studentName, matricNumber, amount, campaignTitle, reference, timestamp])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `levyflow-receipt-${reference}.png`
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center backdrop-blur-lg relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
      
      {/* Header */}
      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-pulse" />
      </div>
      
      <h1 className="text-xl font-black text-white tracking-tight mb-1">
        Proof Recorded Successfully
      </h1>
      <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
        Your payment proof is successfully registered. Save or download the QR receipt below to hold as your official clearance.
      </p>

      {/* QR container */}
      <div className="bg-white rounded-xl p-4 inline-block shadow-lg border border-slate-800 relative group">
        {qrDataUrl ? (
          <img 
            src={qrDataUrl} 
            alt="Payment Receipt QR" 
            className="w-48 h-48 mx-auto object-contain select-none"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-lg">
            <QrCode className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        )}
      </div>

      {/* QR Instructions */}
      <div className="mt-3 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/15 rounded-lg p-2 max-w-xs mx-auto flex items-center gap-1.5 justify-center">
        <ShieldCheck className="w-3.5 h-3.5" /> Client-Held Proof-of-Payment custodian active
      </div>

      {/* Transaction Details */}
      <div className="mt-5 text-left text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 select-all">
        <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
          <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Reference</span>
          <span className="text-slate-200 font-mono font-bold">{reference}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
          <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Full Name</span>
          <span className="text-slate-200 font-medium truncate max-w-[200px]">{studentName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
          <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Matric No</span>
          <span className="text-slate-200 font-semibold">{matricNumber}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
          <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Amount</span>
          <span className="text-white font-black">₦{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Campaign</span>
          <span className="text-slate-200 font-medium truncate max-w-[180px]">{campaignTitle}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-5">
        <Button 
          onClick={handleDownload}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Save QR Code
        </Button>
        
        <Button 
          onClick={() => window.close()}
          className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-2 rounded-lg transition-colors border border-slate-700"
        >
          Done
        </Button>
      </div>

      <LegalDisclaimer variant="dark" />
    </div>
  )
}
