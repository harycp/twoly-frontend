import { apiService } from './api.service';
import { authStore } from '../stores/auth.store.svelte.ts';
import type {
	AuthResponse,
	LoginRequest,
	RegisterRequest,
	UpdateProfileRequest,
	User
} from '../types/auth.types';

export const authService = {
	async register(data: RegisterRequest): Promise<User> {
		const response = await apiService.post<User>('/auth/register', data, { requiresAuth: false });
		return response;
	},

	async login(data: LoginRequest): Promise<AuthResponse> {
		const response = await apiService.post<AuthResponse>('/auth/login', data, {
			requiresAuth: false
		});

		authStore.login(response.access_token, response.user);

		return response;
	},

	async getMe(): Promise<User> {
		const user = await apiService.get<User>('/auth/me');

		authStore.updateUser(user);

		return user;
	},

	async updateProfile(data: UpdateProfileRequest): Promise<User> {
		const user = await apiService.put<User>('/auth/me', data);

		authStore.updateUser(user);

		return user;
	},

	logout() {
		authStore.logout();
	}
};
