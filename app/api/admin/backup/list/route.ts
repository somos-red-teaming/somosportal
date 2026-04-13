import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { listBackups } from '@/lib/gdrive/client'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GH_ACTIONS_TOKEN

  // Fetch GH Actions runs and Google Drive files in parallel
  const [runsResult, filesResult] = await Promise.allSettled([
    token ? fetch(
      'https://api.github.com/repos/somos-red-teaming/somosportal/actions/workflows/database-backup-gdrive.yml/runs?per_page=20',
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    ).then(r => r.json()) : Promise.resolve({ workflow_runs: [] }),
    listBackups(),
  ])

  const runs = runsResult.status === 'fulfilled'
    ? (runsResult.value.workflow_runs || []).map((run: any) => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        trigger: run.event === 'workflow_dispatch' ? 'Manual' : 'Scheduled',
        url: run.html_url,
      }))
    : []

  const files = filesResult.status === 'fulfilled' ? filesResult.value : []

  return NextResponse.json({ runs, files })
}
