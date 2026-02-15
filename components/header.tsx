'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, User, LogOut, Settings, Shield, Coins, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const [isDark, setIsDark] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [pendingInvites, setPendingInvites] = useState(0)
  const { user, signOut, loading } = useAuth()
  const { isAdmin } = useRole()
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  // Fetch user credits
  useEffect(() => {
    if (!user) return setCredits(null)
    
    const supabase = createClient()
    supabase
      .from('users')
      .select('credits')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => setCredits(data?.credits ?? null))
  }, [user])

  // Fetch pending invites count
  useEffect(() => {
    if (!user) return setPendingInvites(0)
    
    const fetchInvites = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userData) {
        const { count } = await supabase
          .from('exercise_invites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.id)
          .eq('status', 'pending')
        
        setPendingInvites(count || 0)
      }
    }
    fetchInvites()
  }, [user])

  // Listen for credit updates from chat
  useEffect(() => {
    const handler = (e: CustomEvent) => setCredits(e.detail)
    window.addEventListener('creditsUpdate', handler as EventListener)
    return () => window.removeEventListener('creditsUpdate', handler as EventListener)
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-xl font-bold">SOMOS Civic Lab</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/exercises" className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Exercises
            {pendingInvites > 0 && (
              <span className="absolute -top-2 -right-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pendingInvites}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user && credits !== null && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Coins className="h-4 w-4" />
              <span>{credits}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
