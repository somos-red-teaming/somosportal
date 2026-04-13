import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { downloadFile } from '@/lib/gdrive/client'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fileId = request.nextUrl.searchParams.get('fileId')
  const fileName = request.nextUrl.searchParams.get('fileName') || 'backup.sql.gz'
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  try {
    const res = await downloadFile(fileId)
    if (!res.ok) throw new Error('Download failed')

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 })
  }
}
