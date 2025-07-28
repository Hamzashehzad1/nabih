
'use server';

import { z } from 'zod';

const BackupSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO 8601 format
  status: z.enum(['completed', 'failed', 'in-progress']),
  size: z.string(),
  type: z.enum(['full', 'database_only']),
  files: z.number(),
  dbTables: z.number(),
});

export type SiteBackup = z.infer<typeof BackupSchema>;


async function makeBackupApiRequest(siteUrl: string, username: string, appPassword: string, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: object) {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/content-forge/v1/backups${endpoint}`;
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.message || 'Unknown error'}`;
            } catch (e) {}
            return { success: false, error: errorDetails };
        }
        
        const data = await response.json();
        return { success: true, data };
        
    } catch (error) {
        console.error(`Error during Backup API request to ${endpoint}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}


export async function fetchBackups(siteUrl: string, username: string, appPassword: string): Promise<{ success: true; data: SiteBackup[] } | { success: false; error: string }> {
    const result = await makeBackupApiRequest(siteUrl, username, appPassword, '');
    if (!result.success) return result;
    
    const parsed = z.array(BackupSchema).safeParse(result.data);
     if (!parsed.success) {
      console.error('Backup Parse Error:', parsed.error);
      return { success: false, error: "Failed to parse backup data from your site. Ensure the companion plugin is active and returns data in the correct format." };
    }
    
    return { success: true, data: parsed.data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
}

export async function createBackup(siteUrl: string, username: string, appPassword: string): Promise<{ success: true, data: SiteBackup } | { success: false, error: string }> {
    return makeBackupApiRequest(siteUrl, username, appPassword, '/create', 'POST');
}

export async function restoreBackup(siteUrl: string, username: string, appPassword: string, backupId: string): Promise<{ success: true } | { success: false, error: string }> {
    return makeBackupApiRequest(siteUrl, username, appPassword, `/restore`, 'POST', { backupId });
}

export async function deleteBackup(siteUrl: string, username: string, appPassword: string, backupId: string): Promise<{ success: true } | { success: false, error: string }> {
    return makeBackupApiRequest(siteUrl, username, appPassword, `/delete`, 'POST', { backupId });
}
