'use client'

import Link from 'next/link'
import { 
  ShieldCheck, 
  ScanLine, 
  FileSpreadsheet, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Fingerprint
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] -top-60 -left-60 -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] -bottom-60 -right-60 -z-10" />

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Levy<span className="text-blue-400">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <span className="text-sm font-semibold text-slate-350 hover:text-white transition-colors cursor-pointer">
              Admin Login
            </span>
          </Link>
          <Link href="/campaigns">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 shadow-lg shadow-blue-500/20 rounded-lg transition-all flex items-center gap-1.5">
              Launch Console <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-xs font-bold text-blue-400 uppercase tracking-widest animate-pulse">
            <Cpu className="w-3.5 h-3.5" /> Next-Gen Forensic Reconciliation
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-400">
            Automating Educational Levy Auditing
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            LevyFlow decodes student transaction receipts from popular banking apps via Google Cloud Document AI, runs fuzzy name similarity checks, and aggregates them into immutable event ledgers.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/campaigns">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-xl shadow-blue-500/25 text-sm flex items-center justify-center gap-2 group transition-all">
                Access Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full sm:w-auto border-white/10 hover:bg-white/5 text-slate-300 font-bold py-3.5 px-8 rounded-xl text-sm transition-all">
                Sign In As School Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-5xl mx-auto mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <ScanLine className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Document AI OCR Pipeline</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Extracts sender name, amount, bank name, reference number, and timestamps from bank receipts (OPay, Moniepoint, etc.) with deep confidence score modeling.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Fuzzy Name Matcher</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Leverages advanced Jaccard token set intersections and Levenshtein edit distance calculations to auto-approve payments despite name variances.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Fingerprint className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Immutable Event Chain</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Records all student transactions and overrides on an append-only verification ledger guarded by cryptographically hashed chains (SHA-256).
            </p>
          </div>
        </div>

        {/* Excel Export Info */}
        <div className="max-w-4xl mx-auto mt-24 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-3xl p-8 sm:p-12 text-left relative overflow-hidden backdrop-blur-lg">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -z-10" />
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Direct Reconciliation Export
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Export Dual-Sheet Excel Ledgers With Verification QRs
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Instantly compile student receipts sorted alphabetically, alongside verification columns. Every row embeds an immutable evidence QR code redirecting directly to the secure proof hosting server.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
