export interface Memory {
    id: string;
    couple_id: string;
    created_by: string;
    title: string;
    description: string;
    memory_date: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    mood?: string;
    tags?: string[];
    created_at: string;
}

export interface ChecklistItem {
    id: string;
    item: string;
    is_checked: boolean;
}

export interface DatePlan {
    id: string;
    couple_id: string;
    created_by: string;
    title: string;
    notes?: string;
    plan_date: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
    checklists: ChecklistItem[];
    created_at: string;
}