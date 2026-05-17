import { apiService } from './api.service';
import type { Memory } from '../types/models.types';

export const memoryService = {
    async getMemories(month?: string): Promise<Memory[]> {
        return await apiService.get<Memory[]>('/memories', {
            params: month ? { month } : undefined
        });
    }
};