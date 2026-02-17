'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDB() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...')
        const supabase = createClient()
        const { data, error } = await supabase.from('_test').select('*').limit(1)
        console.log('Response:', { data, error })
        
        if (error && (error.code === 'PGRST116' || error.message.includes('Could not find the table'))) {
          // Table doesn't exist, but connection works
          setConnected(true)
        } else if (!error) {
          setConnected(true)
        } else {
          setError(error.message)
        }
      } catch (err) {
        console.error('Connection failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) return <div className="p-8">Testing Supabase connection...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {connected ? (
        <div className="text-green-600">✅ Connected to Supabase successfully!</div>
      ) : (
        <div className="text-red-600">
          <div>❌ Failed to connect to Supabase</div>
          {error && <div className="mt-2 text-sm">Error: {error}</div>}
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
        <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}</div>
      </div>
    </div>
  )
}
