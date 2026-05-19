import { apiService } from './api.service';
import type { DatePlan, Memory } from '../types/models.types';

export interface CreateDatePlanRequest {
    title: string;
    notes?: string;
    plan_date: string; // ISO 8601 format
    location_name?: string;
    latitude?: number;
    longitude?: number;
    checklists?: string[];
}

export const datePlanService = {
    async getDatePlans(status?: string): Promise<DatePlan[]> {
        return await apiService.get<DatePlan[]>('/date-plans', {
            params: status ? { status } : undefined
        });
    },

    async createDatePlan(data: CreateDatePlanRequest): Promise<DatePlan> {
        return await apiService.post<DatePlan>('/date-plans', data);
    },

    async getDatePlanDetail(id: string): Promise<DatePlan> {
        return await apiService.get<DatePlan>(`/date-plans/${id}`);
    },

    // --- FUNGSI EDIT DAN DELETE YANG SEBELUMNYA TERTINGGAL ---

    async updateDatePlan(id: string, data: Partial<CreateDatePlanRequest>): Promise<DatePlan> {
        return await apiService.put<DatePlan>(`/date-plans/${id}`, data);
    },

    async deleteDatePlan(id: string): Promise<void> {
        return await apiService.delete(`/date-plans/${id}`);
    },

    // --- FUNGSI LAINNYA ---

    async updateDatePlanStatus(id: string, data: { status: string }): Promise<DatePlan> {
        return await apiService.patch<DatePlan>(`/date-plans/${id}/status`, data);
    },

    async convertToMemory(id: string): Promise<Memory> {
        return await apiService.post<Memory>(`/date-plans/${id}/convert-to-memory`, {});
    },

    async addChecklistItem(id: string, data: { item: string }): Promise<void> {
        return await apiService.post(`/date-plans/${id}/checklists`, data);
    },

    async updateChecklistItem(id: string, checklistId: string, data: { is_checked: boolean }): Promise<void> {
        return await apiService.patch(`/date-plans/${id}/checklists/${checklistId}`, data);
    },

    async deleteChecklistItem(id: string, checklistId: string): Promise<void> {
        return await apiService.delete(`/date-plans/${id}/checklists/${checklistId}`);
    }
};