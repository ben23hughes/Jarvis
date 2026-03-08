import { google } from 'googleapis'
import { getValidToken } from '@/lib/oauth/token-refresh'

async function getDriveClient(userId: string) {
  const accessToken = await getValidToken(userId, 'google_drive')
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth })
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink?: string
}

export async function searchDriveFiles(userId: string, query: string, maxResults = 10): Promise<DriveFile[]> {
  const drive = await getDriveClient(userId)

  const response = await drive.files.list({
    q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
    pageSize: maxResults,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  })

  return (response.data.files ?? []).map((f) => ({
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    modifiedTime: f.modifiedTime ?? '',
    webViewLink: f.webViewLink ?? undefined,
  }))
}

export async function getDriveFileContent(userId: string, fileId: string): Promise<string> {
  const drive = await getDriveClient(userId)

  // Export Google Docs as plain text, otherwise download
  const meta = await drive.files.get({ fileId, fields: 'mimeType,name' })
  const mimeType = meta.data.mimeType ?? ''

  if (mimeType === 'application/vnd.google-apps.document') {
    const response = await drive.files.export({ fileId, mimeType: 'text/plain' })
    return response.data as string
  }

  // For non-Google files, return metadata only
  return `File: ${meta.data.name} (${mimeType}) — content preview not available for this file type`
}
