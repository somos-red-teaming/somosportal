'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AccountDeactivatedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/login'), 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Account Deactivated</h1>
          <p className="text-muted-foreground mb-4">
            Your account has been deactivated. Please contact support if you believe this is an error.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to login in 5 seconds...</p>
        </CardContent>
      </Card>
    </div>
  )
}
