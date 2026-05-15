import { browser } from '$app/environment';
import type { User } from '../types/auth.types';

class AuthStore {
	token = $state<string | null>(null);
	user = $state<User | null>(null);

	get isAuthenticated() {
		return !!this.token;
	}

	constructor() {
		if (browser) {
			this.token = localStorage.getItem('access_token');
			const storedUser = localStorage.getItem('user');

			if (storedUser) {
				try {
					this.user = JSON.parse(storedUser);
				} catch (error) {
					console.error('Failed to parse user from local storage:', error);
					this.logout();
				}
			}
		}
	}

	login(token: string, user: User) {
		this.token = token;
		this.user = user;

		if (browser) {
			localStorage.setItem('access_token', token);
			localStorage.setItem('user', JSON.stringify(user));
		}
	}

	updateUser(user: User) {
		this.user = user;
		if (browser) {
			localStorage.setItem('user', JSON.stringify(user));
		}
	}

	logout() {
		this.token = null;
		this.user = null;

		if (browser) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('user');
		}
	}
}

export const authStore = new AuthStore();
