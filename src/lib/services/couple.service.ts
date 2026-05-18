import { apiService } from './api.service';
import { coupleStore } from '../stores/couple.store.svelte';
import type { Couple, CreateInviteRequest, JoinCoupleRequest } from '../types/couple.types';

export interface UpdateCoupleSettingsRequest {
    anniversary_date?: string;
}

export const coupleService = {
    async getMyCouple(): Promise<Couple> {
        try {
            const couple = await apiService.get<Couple>('/couples/me');
            coupleStore.setCouple(couple);
            return couple;
        } catch (error) {
            coupleStore.clear();
            throw error;
        }
    },

    async createInvite(data: CreateInviteRequest = {}): Promise<Couple> {
        await apiService.post('/couples/invite', data);
        return await this.getMyCouple();
    },

    async joinCouple(data: JoinCoupleRequest): Promise<void> {
        await apiService.post('/couples/join', data);
        await this.getMyCouple();
    },

    async updateCoupleSettings(data: UpdateCoupleSettingsRequest): Promise<Couple> {
        const couple = await apiService.put<Couple>('/couples/me', data);
        coupleStore.setCouple(couple);
        return couple;
    }
};