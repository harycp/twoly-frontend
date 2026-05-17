import { apiService } from './api.service';
import type { Memory } from '../types/models.types';

export interface CreateMemoryRequest {
    title: string;
    description?: string;
    memory_date: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    mood?: string;
    tags?: string[];
}

export const memoryService = {
    async getMemories(month?: string): Promise<Memory[]> {
        return await apiService.get<Memory[]>('/memories', {
            params: month ? { month } : undefined
        });
    },

    async getMemoryDetail(id: string): Promise<Memory> {
        return await apiService.get<Memory>(`/memories/${id}`);
    },

    async createMemory(data: CreateMemoryRequest): Promise<Memory> {
        return await apiService.post<Memory>('/memories', data);
    },

    async updateMemory(id: string, data: Partial<CreateMemoryRequest>): Promise<Memory> {
        return await apiService.put<Memory>(`/memories/${id}`, data);
    },

    async deleteMemory(id: string): Promise<void> {
        return await apiService.delete(`/memories/${id}`);
    }
};