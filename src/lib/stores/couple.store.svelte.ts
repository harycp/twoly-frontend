import { browser } from '$app/environment';
import type { Couple } from '../types/couple.types';

class CoupleStore {
	data = $state<Couple | null>(null);

	get isActive() {
		return this.data?.status === 'active';
	}

	get isPending() {
		return this.data?.status === 'pending';
	}

	get partner() {
		return this.data?.partner || null;
	}

	constructor() {
		if (browser) {
			const storedCouple = localStorage.getItem('couple');
			if (storedCouple) {
				try {
					this.data = JSON.parse(storedCouple);
				} catch (error) {
					console.error('Failed to parse couple state from local storage:', error);
					this.clear();
				}
			}
		}
	}

	setCouple(couple: Couple) {
		this.data = couple;
		if (browser) {
			localStorage.setItem('couple', JSON.stringify(couple));
		}
	}

	clear() {
		this.data = null;
		if (browser) {
			localStorage.removeItem('couple');
		}
	}
}

export const coupleStore = new CoupleStore();
