import { apiService } from './api.service';
import type { SyncGDrivePhotosResponse } from '../types/gdrive.types';

export interface MemoryPhoto {
    id: string;
    memory_id: string;
    uploaded_by: string;
    photo_url: string;
    media_type?: 'image' | 'video';
    storage_provider?: 'cloudinary' | 'gdrive';
    cloudinary_public_id?: string;
    drive_file_id?: string;
    thumbnail_url?: string;
    caption?: string;
    created_at: string;
}

export interface GalleryMemoryDetail {
    id: string;
    title: string;
    description?: string;
    memory_date: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    mood?: string;
    tags?: string[];
    created_at: string;
}

export interface GalleryPhoto extends MemoryPhoto {
    memory: GalleryMemoryDetail;
}

export const photoService = {
    async getPhotos(memoryId: string): Promise<MemoryPhoto[]> {
        return await apiService.get<MemoryPhoto[]>(`/memories/${memoryId}/photos`);
    },

    async uploadPhotos(memoryId: string, files: FileList | File[], captions: string[] = []): Promise<MemoryPhoto[]> {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        captions.forEach(caption => formData.append('captions', caption));
        return await apiService.post<MemoryPhoto[]>(`/memories/${memoryId}/photos`, formData);
    },

    async syncGDrivePhotos(memoryId: string, folderUrl?: string): Promise<SyncGDrivePhotosResponse> {
        return await apiService.post<SyncGDrivePhotosResponse>(`/memories/${memoryId}/photos/sync-gdrive`, {
            folder_url: folderUrl
        });
    },

    async deletePhoto(memoryId: string, photoId: string): Promise<void> {
        await apiService.delete(`/memories/${memoryId}/photos/${photoId}`);
    },

    async getGalleryPhotos(): Promise<GalleryPhoto[]> {
        return await apiService.get<GalleryPhoto[]>('/memories/photos');
    }
};