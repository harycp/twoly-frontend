import { apiService } from './api.service';

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    event_date: string; // ISO string
    event_type: 'custom' | 'memory' | 'date_plan' | 'anniversary';
    reference_id?: string;
    location_name?: string;
    status?: string;
}

export const calendarService = {
    async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
        return await apiService.get<CalendarEvent[]>('/calendar/events', {
            params: { start, end }
        });
    }
};