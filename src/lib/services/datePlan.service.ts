import { apiService } from './api.service';
import type { DatePlan } from '../types/models.types';

export const datePlanService = {
    async getDatePlans(status?: string): Promise<DatePlan[]> {
        return await apiService.get<DatePlan[]>('/date-plans', {
            params: status ? { status } : undefined
        });
    }
};