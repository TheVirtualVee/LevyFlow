import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LevyFlow — Payment Verification and Reconciliation Ledger',
  description: 'Forensic audit and payment reconciliation for Nigerian schools and universities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  )
}
