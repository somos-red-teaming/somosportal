import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST() {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GH_ACTIONS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GH_ACTIONS_TOKEN not configured' }, { status: 500 })
  }

  const res = await fetch(
    'https://api.github.com/repos/somos-red-teaming/somosportal/actions/workflows/database-backup-gdrive.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    return NextResponse.json({ error: `GitHub API error: ${error}` }, { status: res.status })
  }

  return NextResponse.json({ success: true, message: 'Backup triggered' })
}
