'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { SystemStatus } from '@/components/SystemStatus'

const navLinks = [
  { href: '/campaigns', label: 'Campaigns', icon: FolderOpen },
  { href: '/admin/schools/onboard', label: 'School Onboarding', icon: ShieldCheck, adminOnly: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await (supabase
            .from('user_profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile?.role) {
            setRole(profile.role)
          }
        }
      } catch (e) {
        console.error('Error fetching role:', e)
      }
    }
    loadRole()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const visibleLinks = navLinks.filter(link => !link.adminOnly || role === 'super_admin')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto lg:flex',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <span className="text-xl font-bold tracking-tight text-white">
            Levy<span className="text-blue-400">Flow</span>
          </span>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Health Monitor */}
        <div className="px-3 pb-2 hidden lg:block">
          <SystemStatus />
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              LevyFlow Dashboard
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
