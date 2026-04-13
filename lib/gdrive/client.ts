/**
 * Google Drive API helper using rclone's OAuth credentials
 * Refreshes access token automatically using the refresh_token from RCLONE_GDRIVE_TOKEN
 */

// SOMOS Google Cloud OAuth credentials
const GDRIVE_CLIENT_ID = process.env.GDRIVE_CLIENT_ID || ''
const GDRIVE_CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET || ''

interface GDriveFile {
  id: string
  name: string
  size: string
  createdTime: string
  mimeType: string
}

async function getAccessToken(): Promise<string> {
  const tokenJson = process.env.RCLONE_GDRIVE_TOKEN
  if (!tokenJson) throw new Error('RCLONE_GDRIVE_TOKEN not configured')

  const token = JSON.parse(tokenJson)

  // Refresh the access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GDRIVE_CLIENT_ID,
      client_secret: GDRIVE_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Google Drive token')
  const data = await res.json()
  return data.access_token
}

export async function listBackups(): Promise<GDriveFile[]> {
  const accessToken = await getAccessToken()

  // Find somos-backups folder first
  const parentRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='somos-backups' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  const parentData = await parentRes.json()
  const parentId = parentData.files?.[0]?.id
  if (!parentId) return []

  // Find database folder inside somos-backups
  const folderRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='database' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  const folderData = await folderRes.json()
  const folderId = folderData.files?.[0]?.id
  if (!folderId) return []

  // List files in the folder
  const filesRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,size,createdTime,mimeType)&orderBy=createdTime desc&pageSize=20`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  const filesData = await filesRes.json()
  return filesData.files || []
}

export async function downloadFile(fileId: string): Promise<Response> {
  const accessToken = await getAccessToken()
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
}
