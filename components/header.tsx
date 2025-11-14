'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark')
    setIsDark(dark)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
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
          <Link href="/exercises" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Exercises
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Documentation
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="hidden md:inline-flex">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
