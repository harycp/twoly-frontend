import { apiService } from './api.service';
import { authStore } from '../stores/auth.store.svelte';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../types/auth.types';

export const authService = {
    async register(data: RegisterRequest): Promise<User> {
        const response = await apiService.post<User>('/auth/register', data, { requiresAuth: false });
        return response;
    },

    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/login', data, { requiresAuth: false });
        authStore.login(response.access_token, response.user);
        return response;
    },

    async getMe(): Promise<User> {
        const user = await apiService.get<User>('/auth/me');
        authStore.updateUser(user);
        return user;
    },

    async updateProfile(data: UpdateProfileRequest): Promise<User> {
        let payload: FormData | UpdateProfileRequest;

        if (data.avatar) {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.username) formData.append('username', data.username);
            formData.append('avatar', data.avatar);
            payload = formData;
        } else {
            payload = {
                name: data.name,
                username: data.username,
                avatar_url: data.avatar_url
            };
        }

        const user = await apiService.put<User>('/auth/me', payload);
        authStore.updateUser(user);
        
        return user;
    },

    logout() {
        authStore.logout();
    }
};