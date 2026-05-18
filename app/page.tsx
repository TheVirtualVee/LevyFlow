'use client'

import Link from 'next/link'
import { 
  ShieldCheck, 
  ScanLine, 
  FileSpreadsheet, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Fingerprint,
  Phone,
  Mail,
  MessageSquare
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
            <span className="text-sm font-semibold text-slate-355 hover:text-white transition-colors cursor-pointer">
              Admin Login
            </span>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 shadow-lg shadow-blue-500/20 rounded-lg transition-all flex items-center gap-1.5">
              Launch Console <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Smart Receipt Verification
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-400">
            Stop Chasing Payment Proofs
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Students submit payment transfer screenshots. You get a verified, printable Excel ledger with secure verification QR codes. Reconciliation that takes minutes, not days.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 px-8 rounded-xl shadow-xl shadow-blue-500/25 text-sm flex items-center justify-center gap-2 group transition-all">
                Admin Console Sign In <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-extrabold py-4 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5">
                Create Department / Lecturer Account
              </Button>
            </Link>
          </div>

          {/* Interactive Live Demo Gate */}
          <div className="max-w-xl mx-auto mt-12 bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 text-center backdrop-blur-md">
            <h3 className="text-base font-extrabold text-white mb-1.5 flex items-center justify-center gap-1.5">
              🎬 See It Work in 60 Seconds
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Explore a live, fully functional student payment uploader. Test the token validation, receipt submission, and automatic scanning simulation. No signup required.
            </p>
            <Link href="/pay/demo">
              <Button className="bg-blue-650 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-lg shadow-lg shadow-blue-500/15">
                ▶ Launch Live Demo Campaign
              </Button>
            </Link>
            <p className="text-[10px] text-slate-500 mt-2 font-bold">
              (Simulation includes registration, code unlock, and verification receipt)
             </p>
          </div>

          {/* Sliding Trust Marquee */}
          <div className="w-full py-10 mt-16 border-t border-b border-white/5 bg-slate-950/40 backdrop-blur-sm overflow-hidden relative">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                display: flex;
                width: 200%;
                animation: marquee 25s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center mb-6">
              Empowering Digital Audits Across Prominent Nigerian Institutions
            </p>
            <div className="relative w-full overflow-hidden">
              <div className="animate-marquee gap-8 items-center flex whitespace-nowrap">
                {[
                  { name: 'University of Ibadan', code: 'UI', est: '1948' },
                  { name: 'Covenant University', code: 'CU', est: '2002' },
                  { name: 'University of Lagos', code: 'UNILAG', est: '1962' },
                  { name: 'Yaba College of Technology', code: 'YABATECH', est: '1947' },
                  { name: 'Ahmadu Bello University', code: 'ABU', est: '1962' },
                  { name: 'Obafemi Awolowo University', code: 'OAU', est: '1961' }
                ].concat([
                  { name: 'University of Ibadan', code: 'UI', est: '1948' },
                  { name: 'Covenant University', code: 'CU', est: '2002' },
                  { name: 'University of Lagos', code: 'UNILAG', est: '1962' },
                  { name: 'Yaba College of Technology', code: 'YABATECH', est: '1947' },
                  { name: 'Ahmadu Bello University', code: 'ABU', est: '1962' },
                  { name: 'Obafemi Awolowo University', code: 'OAU', est: '1961' }
                ]).map((inst, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0 select-none">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-xs text-blue-400">
                      {inst.code}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-white">{inst.name}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Est. {inst.est}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Forensic Activity Stream */}
          <div className="max-w-md mx-auto mt-12 p-5 rounded-2xl bg-slate-900/60 border border-white/5 text-left relative backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Verification Flow
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Forensic Matcher Online</span>
            </div>
            <div className="space-y-2.5">
              {[
                { student: 'Chinedu Okafor', dept: 'Economics Department', inst: 'UNILAG', amount: '₦5,000', confidence: '98.4%', match: 'Auto-Verified' },
                { student: 'Aminat Bello', dept: 'Faculty of Science', inst: 'ABU Zaria', amount: '₦3,500', confidence: '96.2%', match: 'Auto-Verified' },
                { student: 'Tunde Bakare', dept: 'Computer Engineering', inst: 'YABATECH', amount: '₦10,000', confidence: '99.1%', match: 'Auto-Verified' }
              ].map((log, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-950/60 border border-white/5 rounded-xl p-3 text-[11px] hover:bg-slate-950 transition-colors">
                  <div>
                    <span className="font-extrabold text-white block">{log.student} ({log.inst})</span>
                    <span className="text-slate-500 text-[10px] block mt-0.5">{log.dept}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">{log.amount}</span>
                    <span className="text-[9px] text-slate-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase mt-1 inline-block">
                      {log.match} ({log.confidence})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-5xl mx-auto mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <ScanLine className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Smart Receipt Logging</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Students upload payment screenshots. Our system securely stores them and extracts key details (amount, date) using smart pattern matching. Unclear receipts are flagged for easy manual review.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Simple Name Verification</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Students enter their name and matric number. You see exactly who has submitted. For name variations or third-party payments, a simple click marks them as verified on your ledger.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-blue-500/20 hover:bg-slate-900/60 transition-all duration-300 backdrop-blur-md">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Fingerprint className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              All payment records and status changes are logged in an append-only verification ledger. You can prove exactly what was submitted, when, and who verified it.
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

        {/* How It Works & Why Universities Choose LevyFlow */}
        <div className="max-w-5xl mx-auto mt-28 pt-12 border-t border-white/5 text-left grid gap-12 md:grid-cols-2">
          {/* How it works */}
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 text-blue-400">
              How It Works For Your School
            </h3>
            <div className="space-y-6">
              {[
                { step: '1', title: 'Deploy Branded Portal', desc: 'We configure and deploy your branded school or department payment verification portal within 14 days.' },
                { step: '2', title: 'Distribute Verification Links', desc: 'Share the pre-registration link with course reps to log expected students, followed by the payment gate link.' },
                { step: '3', title: 'Students Upload Proofs', desc: 'Students enter their 4-digit token and upload their transfer screenshots. Unclear receipts are flagged for simple admin verification.' },
                { step: '4', title: 'Export Reconciled Ledgers', desc: 'Export a neat, sorted dual-sheet Excel ledger with embedded QR codes linking directly to hosted evidence images.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-450 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Universities Choose LevyFlow */}
          <div className="space-y-6 bg-slate-900/20 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2 text-blue-405">
              Why Universities Choose LevyFlow
            </h3>
            <div className="grid gap-4">
              {[
                { title: '🔒 Private & Secure', desc: 'Student data is never shared. Screenshots automatically expire and delete after verification. Full event audit trail maintained.' },
                { title: '⚡ Deployed in 14 Days', desc: 'Your custom branded portal live within two weeks. Onsite coordinator training and user documentation fully included.' },
                { title: '📋 Audit-Ready Ledger', desc: 'Excel exports with embedded QR codes. High-fidelity printable formats meeting standard university record-keeping requirements.' },
                { title: '🎓 Designed for Nigerian Institutions', desc: 'Native support for local commercial and digital banks (GTBank, OPay, Moniepoint). Handles third-party sponsor payments seamlessly.' }
              ].map((badge, i) => (
                <div key={i} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {badge.title}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials & Trust Indicators */}
        <div className="max-w-4xl mx-auto mt-28 py-10 border-t border-b border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
            Institutional Trust & Feedback (Pilot Phase)
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {['UNILAG (Demo)', 'UI (Demo)', 'OAU (Demo)'].map((school, i) => (
              <div key={i} className="px-4 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-xs font-bold text-slate-400">
                🏫 {school}
              </div>
            ))}
          </div>
          <blockquote className="text-sm italic text-slate-350 max-w-xl mx-auto leading-relaxed">
            &ldquo;Reduced our semester departmental levy verification and reconciliation time from 3 days to under 30 minutes. Absolute game changer.&rdquo;
            <span className="block not-italic text-[10px] font-black uppercase tracking-wider text-blue-400 mt-2">
              — Economics Department Secretary, Pilot Program
            </span>
          </blockquote>
        </div>

        {/* Enterprise Call to Action */}
        <div className="max-w-4xl mx-auto mt-28 bg-gradient-to-br from-blue-950/20 via-slate-900/60 to-slate-950 border border-blue-900/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-lg">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/[0.02] -z-10" />
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Ready to Stop Chasing Payment Proofs?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-8">
            See LevyFlow working with your institution&apos;s actual levy structures. Request a live tailored demo and see how easy student payment auditing can be. No obligation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="mailto:hello@levyflow.ng?subject=LevyFlow%20Demo%20Request">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-8 rounded-xl text-sm flex items-center justify-center gap-2 transition-all">
                <MessageSquare className="w-4 h-4" /> Request Demo
              </Button>
            </Link>
            <Link href="mailto:hello@levyflow.ng?subject=LevyFlow%20Enterprise%20Pricing">
              <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-extrabold py-3 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Contact Sales
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-500 font-bold border-t border-white/5 pt-6">
            <a href="https://wa.me/2348031234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-blue-500" /> Call or WhatsApp: +234 803 123 4567
            </a>
            <span className="hidden sm:inline text-slate-800">|</span>
            <a href="mailto:hello@levyflow.ng" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-blue-500" /> Email: hello@levyflow.ng
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
