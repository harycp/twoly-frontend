import { apiService } from './api.service';

export interface LoveNote {
    id: string;
    couple_id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    unlock_at?: string;
    is_opened: boolean;
    opened_at?: string;
    created_at: string;
}

export interface CreateLoveNoteRequest {
    message: string;
    unlock_at?: string;
}

export const loveNoteService = {
    async getLoveNotes(): Promise<LoveNote[]> {
        return await apiService.get<LoveNote[]>('/love-notes');
    },

    async createLoveNote(data: CreateLoveNoteRequest): Promise<LoveNote> {
        return await apiService.post<LoveNote>('/love-notes', data);
    },

    async openLoveNote(id: string): Promise<LoveNote> {
        return await apiService.post<LoveNote>(`/love-notes/${id}/open`, {});
    },

    async deleteLoveNote(id: string): Promise<void> {
        return await apiService.delete(`/love-notes/${id}`);
    }
};