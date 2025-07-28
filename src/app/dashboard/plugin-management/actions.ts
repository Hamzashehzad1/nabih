
'use server';

import { z } from 'zod';

const PluginSchema = z.object({
  name: z.string(),
  plugin: z.string(), // e.g., "akismet/akismet.php"
  version: z.string(),
  author: z.string(),
  status: z.enum(['active', 'inactive']),
  update: z.enum(['available', 'none', 'latest-installed']),
  update_version: z.string().optional(),
});

const ThemeSchema = z.object({
  name: z.string(),
  theme: z.string(), // e.g. "twentytwentyfour"
  version: z.string(),
  author: z.string(),
  status: z.enum(['active', 'inactive']),
  update: z.enum(['available', 'none', 'latest-installed']),
  update_version: z.string().optional(),
});

export interface WpPlugin {
    name: string;
    plugin: string;
    version: string;
    author: string;
    status: 'active' | 'inactive';
    updateAvailable: boolean;
    updateVersion?: string;
}

export interface WpTheme {
    name: string;
    theme: string;
    version: string;
    author: string;
    status: 'active' | 'inactive';
    updateAvailable: boolean;
    updateVersion?: string;
}

async function makeWpApiRequest(siteUrl: string, username: string, appPassword: string, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: object) {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/content-forge/v1/${endpoint}`;
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
        console.error(`Error during WP API request to ${endpoint}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}


export async function fetchPlugins(siteUrl: string, username: string, appPassword: string): Promise<{ success: true; data: WpPlugin[] } | { success: false; error: string }> {
    const result = await makeWpApiRequest(siteUrl, username, appPassword, 'plugins');
    if (!result.success) return result;
    
    const parsed = z.array(PluginSchema).safeParse(result.data);
    if(!parsed.success) {
      return { success: false, error: "Failed to parse plugin data from site." };
    }
    
    const formattedData = parsed.data.map(p => ({
      name: p.name,
      plugin: p.plugin,
      version: p.version,
      author: p.author,
      status: p.status,
      updateAvailable: p.update === 'available',
      updateVersion: p.update_version,
    }));
    
    return { success: true, data: formattedData };
}

export async function fetchThemes(siteUrl: string, username: string, appPassword: string): Promise<{ success: true; data: WpTheme[] } | { success: false; error: string }> {
    const result = await makeWpApiRequest(siteUrl, username, appPassword, 'themes');
    if (!result.success) return result;
    
    const parsed = z.array(ThemeSchema).safeParse(result.data);
    if(!parsed.success) {
      return { success: false, error: "Failed to parse theme data from site." };
    }
    
    const formattedData = parsed.data.map(t => ({
      name: t.name,
      theme: t.theme,
      version: t.version,
      author: t.author,
      status: t.status,
      updateAvailable: t.update === 'available',
      updateVersion: t.update_version,
    }));
    
    return { success: true, data: formattedData };
}

export async function togglePluginStatus(siteUrl: string, username: string, appPassword: string, plugin: string, currentStatus: 'active' | 'inactive') {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    return makeWpApiRequest(siteUrl, username, appPassword, `plugins/${action}`, 'POST', { plugin });
}

export async function updatePlugin(siteUrl: string, username: string, appPassword: string, plugin: string) {
    return makeWpApiRequest(siteUrl, username, appPassword, 'plugins/update', 'POST', { plugin });
}

export async function activateTheme(siteUrl: string, username: string, appPassword: string, theme: string) {
    return makeWpApiRequest(siteUrl, username, appPassword, 'themes/activate', 'POST', { theme });
}

export async function updateTheme(siteUrl: string, username: string, appPassword: string, theme: string) {
    return makeWpApiRequest(siteUrl, username, appPassword, 'themes/update', 'POST', { theme });
}
