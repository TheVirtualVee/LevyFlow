import { LiveMarquee } from '@/components/live-marquee'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <LiveMarquee />
      <main className="pt-0">{children}</main>
    </div>
  )
}
