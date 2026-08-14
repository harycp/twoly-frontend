import type { MemoryPhoto } from '../services/photo.service';

export interface VerifyGDriveFolderRequest {
    folder_url: string;
}

export interface VerifyGDriveFolderResponse {
    folder_id: string;
    folder_name: string;
    is_accessible: boolean;
    service_account_email?: string;
    message: string;
}

export interface GDriveConfigInfoResponse {
    service_account_email: string;
    is_configured: boolean;
}

export interface SyncGDrivePhotosRequest {
    folder_url?: string;
}

export interface SyncGDrivePhotosResponse {
    total_found: number;
    total_imported: number;
    photos: MemoryPhoto[];
    message: string;
}
