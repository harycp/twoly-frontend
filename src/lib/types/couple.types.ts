import type { User } from './auth.types';

export interface Couple {
	id: string;
	user_one_id: string;
	user_two_id?: string;
	invite_code: string;
	anniversary_date?: string;
	status: 'pending' | 'active' | 'ended';
	gdrive_folder_id?: string;
	gdrive_folder_url?: string;
	storage_provider?: 'cloudinary' | 'gdrive';
	gdrive_connected?: boolean;
	created_at: string;
	partner?: User;
}

export interface CreateInviteRequest {
	anniversary_date?: string;
}

export interface JoinCoupleRequest {
	invite_code: string;
}

export interface UpdateCoupleSettingsRequest {
	anniversary_date?: string;
	gdrive_folder_url?: string;
	storage_provider?: 'cloudinary' | 'gdrive';
}
