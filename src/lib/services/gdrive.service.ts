import { apiService } from './api.service';
import type { VerifyGDriveFolderResponse, GDriveConfigInfoResponse } from '../types/gdrive.types';

export const gdriveService = {
    async verifyFolder(folderUrl: string): Promise<VerifyGDriveFolderResponse> {
        return await apiService.post<VerifyGDriveFolderResponse>('/couples/gdrive/verify', {
            folder_url: folderUrl
        });
    },

    async getConfig(): Promise<GDriveConfigInfoResponse> {
        return await apiService.get<GDriveConfigInfoResponse>('/couples/gdrive/config');
    }
};
