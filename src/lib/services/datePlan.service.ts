import { apiService } from './api.service';
import type { DatePlan } from '../types/models.types';

export interface CreateDatePlanRequest {
    title: string;
    notes?: string;
    plan_date: string; // ISO 8601 format
    location_name?: string;
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

    
    async updateDatePlanStatus(id: string, data: { status: string }): Promise<DatePlan> {
        return await apiService.patch<DatePlan>(`/date-plans/${id}/status`, data);
    },

    async convertToMemory(id: string): Promise<{ id: string }> {
        return await apiService.post<{ id: string }>(`/date-plans/${id}/convert-to-memory`, {});
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