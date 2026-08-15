import { apiService } from './api.service';
import type { VerifyGDriveFolderResponse, GDriveConfigInfoResponse, GDriveAuthURLResponse } from '../types/gdrive.types';

export const gdriveService = {
    async verifyFolder(folderUrl: string): Promise<VerifyGDriveFolderResponse> {
        return await apiService.post<VerifyGDriveFolderResponse>('/couples/gdrive/verify', {
            folder_url: folderUrl
        });
    },

    async getConfig(): Promise<GDriveConfigInfoResponse> {
        return await apiService.get<GDriveConfigInfoResponse>('/couples/gdrive/config');
    },

    async getAuthUrl(): Promise<GDriveAuthURLResponse> {
        return await apiService.get<GDriveAuthURLResponse>('/couples/gdrive/auth-url');
    },

    async disconnect(): Promise<{ message: string }> {
        return await apiService.post<{ message: string }>('/couples/gdrive/disconnect', {});
    }
};
