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
import { supabase } from '@/lib/supabase'

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
        <Link href="/" className="flex items-center">
          <svg className="h-9 w-auto" viewBox="0 0 1622.76 335.81" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="SOMOS Civic Lab">
            <g><path d="M1247.43,196.05c-6.6,0-11.83-1.87-15.7-5.61-3.87-3.74-5.8-9.14-5.8-16.2v-12.68c0-7.06,1.93-12.46,5.8-16.2,3.87-3.74,9.1-5.61,15.7-5.61s11.51,1.81,15.04,5.41c3.53,3.61,5.3,8.53,5.3,14.77v.46h-8.28v-.7c0-3.66-.99-6.65-2.98-8.97-1.99-2.32-5.02-3.48-9.09-3.48s-7.35,1.25-9.67,3.75c-2.32,2.5-3.48,5.97-3.48,10.4v12.99c0,4.38,1.16,7.84,3.48,10.36,2.32,2.53,5.54,3.79,9.67,3.79s7.1-1.17,9.09-3.52c1.98-2.35,2.98-5.32,2.98-8.93v-1.31h8.28v1.08c0,6.24-1.77,11.16-5.3,14.77-3.53,3.61-8.55,5.41-15.04,5.41Z"/><path d="M1280.53,151.65c-1.55,0-2.85-.5-3.91-1.51-1.06-1.01-1.59-2.31-1.59-3.91s.53-2.9,1.59-3.91c1.06-1.01,2.36-1.51,3.91-1.51s2.91.5,3.94,1.51c1.03,1.01,1.55,2.31,1.55,3.91s-.52,2.9-1.55,3.91c-1.03,1.01-2.35,1.51-3.94,1.51ZM1276.51,194.96v-38.13h7.97v38.13h-7.97Z"/><path d="M1304.35,194.96l-12.84-38.13h8.43l10.13,32.25h1.24l10.13-32.25h8.43l-12.84,38.13h-12.68Z"/><path d="M1340.86,151.65c-1.55,0-2.85-.5-3.91-1.51-1.06-1.01-1.59-2.31-1.59-3.91s.53-2.9,1.59-3.91c1.06-1.01,2.36-1.51,3.91-1.51s2.91.5,3.94,1.51c1.03,1.01,1.55,2.31,1.55,3.91s-.52,2.9-1.55,3.91c-1.03,1.01-2.35,1.51-3.94,1.51ZM1336.83,194.96v-38.13h7.97v38.13h-7.97Z"/><path d="M1373.57,196.05c-3.66,0-6.97-.77-9.94-2.32-2.97-1.55-5.31-3.79-7.04-6.73-1.73-2.94-2.59-6.47-2.59-10.6v-1.01c0-4.12.86-7.64,2.59-10.56,1.73-2.91,4.07-5.16,7.04-6.73,2.96-1.57,6.28-2.36,9.94-2.36s6.78.67,9.36,2.01c2.58,1.34,4.65,3.12,6.23,5.34,1.57,2.22,2.59,4.67,3.05,7.35l-7.73,1.62c-.26-1.7-.8-3.25-1.62-4.64-.83-1.39-1.99-2.5-3.48-3.33-1.5-.82-3.38-1.24-5.65-1.24s-4.21.5-5.99,1.51c-1.78,1.01-3.18,2.45-4.21,4.33-1.03,1.88-1.55,4.16-1.55,6.84v.7c0,2.68.51,4.98,1.55,6.88,1.03,1.91,2.44,3.35,4.21,4.33,1.78.98,3.78,1.47,5.99,1.47,3.35,0,5.9-.86,7.66-2.59,1.75-1.73,2.86-3.93,3.33-6.61l7.73,1.78c-.62,2.63-1.72,5.05-3.29,7.27-1.57,2.22-3.65,3.98-6.23,5.3-2.58,1.31-5.7,1.97-9.36,1.97Z"/><path d="M1419.59,194.96v-54.14h8.35v46.56h26.06v7.58h-34.42Z"/><path d="M1472.95,196.05c-2.73,0-5.17-.46-7.31-1.39-2.14-.93-3.84-2.29-5.1-4.1-1.26-1.8-1.89-4-1.89-6.57s.63-4.81,1.89-6.53c1.26-1.73,2.99-3.03,5.18-3.91,2.19-.88,4.68-1.31,7.46-1.31h11.6v-2.47c0-2.22-.67-4-2.01-5.34-1.34-1.34-3.4-2.01-6.19-2.01s-4.82.65-6.26,1.93c-1.44,1.29-2.4,2.97-2.86,5.03l-7.42-2.4c.62-2.06,1.61-3.93,2.98-5.61,1.37-1.68,3.18-3.03,5.45-4.06,2.27-1.03,5-1.55,8.2-1.55,4.95,0,8.84,1.26,11.68,3.79,2.84,2.53,4.25,6.11,4.25,10.75v15.7c0,1.55.72,2.32,2.17,2.32h3.25v6.65h-5.95c-1.81,0-3.28-.46-4.41-1.39-1.13-.93-1.7-2.19-1.7-3.79v-.23h-1.16c-.41.77-1.03,1.68-1.86,2.71-.83,1.03-2.04,1.92-3.63,2.67-1.6.75-3.71,1.12-6.34,1.12ZM1474.11,189.47c3.2,0,5.77-.91,7.73-2.75,1.96-1.83,2.94-4.34,2.94-7.54v-.77h-11.14c-2.11,0-3.82.45-5.1,1.35-1.29.9-1.93,2.23-1.93,3.98s.67,3.15,2.01,4.18c1.34,1.03,3.17,1.55,5.49,1.55Z"/><path d="M1527.01,196.05c-3.71,0-6.56-.67-8.55-2.01-1.99-1.34-3.47-2.84-4.45-4.49h-1.24v5.41h-7.81v-54.14h7.97v21.19h1.24c.62-1.03,1.44-2.02,2.47-2.98,1.03-.95,2.4-1.74,4.1-2.36,1.7-.62,3.79-.93,6.26-.93,3.2,0,6.14.77,8.82,2.32,2.68,1.55,4.82,3.79,6.42,6.73,1.6,2.94,2.4,6.45,2.4,10.52v1.16c0,4.13-.81,7.64-2.44,10.56-1.62,2.91-3.76,5.14-6.42,6.69-2.66,1.55-5.58,2.32-8.78,2.32ZM1524.69,189.09c3.45,0,6.3-1.11,8.55-3.33,2.24-2.22,3.36-5.39,3.36-9.51v-.7c0-4.07-1.11-7.22-3.33-9.44-2.22-2.22-5.08-3.33-8.58-3.33s-6.23,1.11-8.47,3.33c-2.24,2.22-3.36,5.36-3.36,9.44v.7c0,4.13,1.12,7.3,3.36,9.51,2.24,2.22,5.07,3.33,8.47,3.33Z"/></g>
            <g><path d="M535.85,76.28c-24.57,0-47.6,9.5-64.86,26.76-17.26,17.26-26.76,40.29-26.76,64.86s9.5,47.6,26.76,64.86,40.29,26.76,64.86,26.76,47.6-9.5,64.86-26.76c17.26-17.26,26.76-40.29,26.76-64.86s-9.5-47.6-26.76-64.86c-17.26-17.26-40.29-26.76-64.86-26.76ZM535.85,99.95c36.83,0,66.79,30.48,66.79,67.95s-29.96,67.95-66.79,67.95-66.79-30.48-66.79-67.95,29.96-67.95,66.79-67.95Z"/><path d="M744.83,219.57l-64.5-137.34c-.65-1.38-2.03-2.25-3.55-2.25h-27.66c-2.17,0-3.92,1.76-3.92,3.92v168c0,2.17,1.76,3.92,3.92,3.92h16.99c2.17,0,3.92-1.76,3.92-3.92v-114.62c0-4.19,5.69-5.46,7.47-1.66l55.21,117.94c.65,1.38,2.03,2.26,3.55,2.26h24.24c1.52,0,2.91-.88,3.55-2.26l55.21-117.94c1.78-3.8,7.47-2.53,7.47,1.66v114.62c0,2.17,1.76,3.92,3.92,3.92h16.99c2.17,0,3.92-1.76,3.92-3.92V83.9c0-2.17-1.76-3.92-3.92-3.92h-27.66c-1.52,0-2.9.88-3.55,2.25l-64.5,137.34c-1.41,3-5.69,3-7.1,0Z"/><path d="M960.9,76.28c-24.57,0-47.6,9.5-64.86,26.76-17.26,17.26-26.76,40.29-26.76,64.86s9.5,47.6,26.76,64.86c17.26,17.26,40.29,26.76,64.86,26.76s47.6-9.5,64.86-26.76c17.26-17.26,26.76-40.29,26.76-64.86s-9.5-47.6-26.76-64.86c-17.26-17.26-40.29-26.76-64.86-26.76ZM960.9,235.84c-36.83,0-66.79-30.48-66.79-67.95s29.96-67.95,66.79-67.95,66.79,30.48,66.79,67.95-29.96,67.95-66.79,67.95Z"/><path d="M1134.09,184.67l-21.47-36.01-5.78-9.95c-1.04-1.78-2.03-3.46-2.97-5.05-5.34-9.02-8.57-14.46-8.57-20.12,0-4.62,1.64-10.13,9.44-10.13h34.51c2.17,0,3.92-1.76,3.92-3.92v-15.6c0-2.17-1.76-3.92-3.92-3.92h-32.66c-24.82,0-36.12,17.4-36.12,33.57,0,8.85,4.59,20.45,14.86,37.57l21.47,36.01,5.78,9.95c.82,1.41,1.61,2.76,2.37,4.05,5.57,9.48,8.94,15.2,8.94,21.12,0,4.62-1.64,10.13-9.44,10.13h-43.76c-2.17,0-3.92,1.76-3.92,3.92v15.6c0,2.17,1.76,3.92,3.92,3.92h41.91c24.82,0,36.12-17.4,36.12-33.57,0-9-4.65-20.94-14.63-37.57Z"/><path d="M385.59,133.68c-5.34-9.02-8.57-14.46-8.57-20.11,0-4.62,1.64-10.13,9.44-10.13h34.5c2.16,0,3.92-1.75,3.92-3.92v-15.59c0-2.16-1.75-3.92-3.92-3.92h-32.65c-24.81,0-36.11,17.4-36.11,33.56,0,8.85,4.58,20.44,14.86,37.56l21.46,36s17.09,29.19,17.09,35.1c0,4.62-1.64,10.13-9.44,10.13h-43.75c-2.16,0-3.92,1.75-3.92,3.92v15.59c0,2.16,1.75,3.92,3.92,3.92h41.9c24.81,0,36.11-17.4,36.11-33.56,0-9-4.65-20.93-14.62-37.56,0,0-29.27-49.4-30.21-50.99Z"/></g>
            <path d="M253.14,167.3l-76.5.93c-2.93.04-5.51-1.65-6.73-4.41-.64-1.43-.7-3.24-.12-5.3l13.67-76.28c.23-1.3-.63-2.54-1.93-2.77l-14.45-2.59c-1.29-.23-2.53.63-2.77,1.93l-9.11,50.84c-.53,2.98-4.49,3.7-6.03,1.09l-12.04-20.29c-.32-.55-.84-.94-1.46-1.1-.62-.16-1.26-.06-1.81.26l-12.63,7.5c-1.12.68-1.5,2.14-.83,3.27l39.06,65.78c1.49,2.52,1.32,5.6-.45,8.04-.92,1.27-2.46,2.23-4.53,2.75l-72.9,26.31c-.6.22-1.08.66-1.35,1.23-.27.58-.3,1.22-.08,1.82l4.98,13.81c.21.6.65,1.08,1.23,1.35.58.27,1.23.3,1.82.08l46.35-16.73c3.62-1.31,6.92,2.59,5.03,5.94l-10.38,18.5c-.64,1.15-.24,2.6.91,3.25l12.81,7.19c1.15.64,2.6.23,3.24-.91l37.44-66.72c1.43-2.55,4.19-3.95,7.19-3.63,1.56.16,3.16,1.01,4.64,2.54l59.23,49.98c.86.73,2.09.73,2.96.09.14-.11.28-.23.4-.37l9.47-11.22c.41-.49.61-1.11.55-1.74-.05-.64-.35-1.21-.84-1.62l-37.92-31.99c-2.85-2.41-1.18-7.06,2.55-7.11l21.55-.26c1.32-.01,2.37-1.1,2.36-2.42l-.18-14.68c0-.64-.27-1.23-.72-1.68-.46-.44-1.06-.68-1.69-.68Z"/>
          </svg>
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
