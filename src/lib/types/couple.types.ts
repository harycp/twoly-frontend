import type { User } from './auth.types';

export interface Couple {
	id: string;
	user_one_id: string;
	user_two_id?: string;
	invite_code: string;
	anniversary_date?: string;
	status: 'pending' | 'active' | 'ended';
	created_at: string;
	partner?: User;
}

export interface CreateInviteRequest {
	anniversary_date?: string;
}

export interface JoinCoupleRequest {
	invite_code: string;
}
