import { apiService } from './api.service';

export interface MemoryPhoto {
    id: string;
    memory_id: string;
    photo_url: string;
    caption?: string;
    created_at: string;
}

export const photoService = {
    async getPhotos(memoryId: string): Promise<MemoryPhoto[]> {
        return await apiService.get<MemoryPhoto[]>(`/memories/${memoryId}/photos`);
    },

    async uploadPhotos(memoryId: string, files: FileList | File[], captions: string[] = []): Promise<MemoryPhoto[]> {
        const formData = new FormData();
        
        // Append semua file ke key "files" (sesuai backend Golang kita)
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        // Append caption jika ada
        captions.forEach(caption => {
            formData.append('captions', caption);
        });

        return await apiService.post<MemoryPhoto[]>(`/memories/${memoryId}/photos`, formData);
    },

    async deletePhoto(memoryId: string, photoId: string): Promise<void> {
        await apiService.delete(`/memories/${memoryId}/photos/${photoId}`);
    }
};