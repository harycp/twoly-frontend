import { apiService } from './api.service';

export interface MemoryPhoto {
    id: string;
    memory_id: string;
    uploaded_by: string;
    photo_url: string;
    cloudinary_public_id: string;
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

    async deletePhoto(memoryId: string, photoId: string): Promise<void> {
        await apiService.delete(`/memories/${memoryId}/photos/${photoId}`);
    },

    async getGalleryPhotos(): Promise<GalleryPhoto[]> {
        return await apiService.get<GalleryPhoto[]>('/memories/photos');
    }
};