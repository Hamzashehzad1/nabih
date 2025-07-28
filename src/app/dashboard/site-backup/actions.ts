
'use server';

import { z } from 'zod';

export interface SiteBackup {
    id: string;
    date: string;
    status: 'completed' | 'failed' | 'in-progress';
    size: string; // e.g., "1.2 GB"
    type: 'full' | 'database_only';
    files: number;
    dbTables: number;
}

// Mock data store for backups
const mockBackups: { [siteId: string]: SiteBackup[] } = {};

function createMockBackup(siteId: string): SiteBackup {
    const id = new Date().toISOString();
    const size = (Math.random() * 2 + 0.5).toFixed(2); // 0.5 to 2.5 GB
    const files = Math.floor(Math.random() * 10000) + 5000; // 5k to 15k files
    const tables = Math.floor(Math.random() * 50) + 10; // 10 to 60 tables

    return {
        id,
        date: id,
        status: 'in-progress',
        size: `${size} GB`,
        type: 'full',
        files: files,
        dbTables: tables,
    };
}


export async function fetchBackups(siteId: string): Promise<{ success: true; data: SiteBackup[] }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!mockBackups[siteId]) {
        mockBackups[siteId] = []; // Initialize if none exist
    }

    return { success: true, data: mockBackups[siteId] };
}

export async function createBackup(siteId: string): Promise<{ success: true, data: SiteBackup }> {
    const newBackup = createMockBackup(siteId);
    
    if (!mockBackups[siteId]) {
        mockBackups[siteId] = [];
    }
    
    mockBackups[siteId].unshift(newBackup); // Add to the beginning of the list

    // Simulate the backup process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const completedBackup = { ...newBackup, status: 'completed' as const };
    
    // Update the "master" list
    mockBackups[siteId] = mockBackups[siteId].map(b => b.id === newBackup.id ? completedBackup : b);
    
    return { success: true, data: completedBackup };
}

export async function restoreBackup(siteId: string, backupId: string): Promise<{ success: true }> {
    // Simulate a restore process
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log(`Restoring backup ${backupId} for site ${siteId}`);
    return { success: true };
}

export async function deleteBackup(siteId: string, backupId: string): Promise<{ success: true }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (mockBackups[siteId]) {
        mockBackups[siteId] = mockBackups[siteId].filter(b => b.id !== backupId);
    }
    console.log(`Deleting backup ${backupId} for site ${siteId}`);
    return { success: true };
}
