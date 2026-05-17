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
    /**
     * Mengambil semua event (Memory, Date Plan, Anniversary) dalam rentang waktu tertentu.
     * @param start String format YYYY-MM-DD
     * @param end String format YYYY-MM-DD
     */
    async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
        return await apiService.get<CalendarEvent[]>('/calendar/events', {
            params: { start, end }
        });
    }
};