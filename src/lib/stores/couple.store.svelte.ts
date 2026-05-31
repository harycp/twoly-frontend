import { browser } from '$app/environment';
import type { Couple } from '../types/couple.types';

type CoupleLike = Couple & { couple_id?: string };

function normalizeCouple(couple: CoupleLike): Couple {
	const normalizedId = couple.id || couple.couple_id;

	return {
		...couple,
		id: normalizedId || ''
	};
}

class CoupleStore {
	data = $state<Couple | null>(null);
	isPartnerOnline = $state<boolean>(false);
	isPartnerPresenceSynced = $state<boolean>(false);
	partnerLastSeen = $state<string | null>(null);

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
					this.data = normalizeCouple(JSON.parse(storedCouple) as CoupleLike);
					if (this.data?.partner?.last_seen) {
						this.partnerLastSeen = this.data.partner.last_seen;
					}
				} catch (error) {
					console.error('Failed to parse couple state from local storage:', error);
					this.clear();
				}
			}
		}
	}

	setCouple(couple: CoupleLike) {
		const normalized = normalizeCouple(couple);

		this.data = normalized;
		if (normalized.partner?.last_seen) {
			this.partnerLastSeen = normalized.partner.last_seen;
		}
		if (browser) {
			localStorage.setItem('couple', JSON.stringify(normalized));
		}
	}

	clear() {
		this.data = null;
		this.isPartnerOnline = false;
		this.isPartnerPresenceSynced = false;
		this.partnerLastSeen = null;
		if (browser) {
			localStorage.removeItem('couple');
		}
	}
}

export const coupleStore = new CoupleStore();