<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { browser } from '$app/environment';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import type { Snippet } from 'svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	import { authStore } from '$lib/stores/auth.store.svelte';
	import { authService } from '$lib/services/auth.service';
	import { coupleService } from '$lib/services/couple.service';
	import { coupleStore } from '$lib/stores/couple.store.svelte';
	import { uiStore } from '$lib/stores/ui.store.svelte';
	import { supabase } from '$lib/services/supabase.service';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 1000 * 60 * 5,
				refetchOnWindowFocus: false
			}
		}
	});

	let { children }: { children: Snippet } = $props();

	let presenceChannel: RealtimeChannel | null = null;
	let presenceHeartbeat: ReturnType<typeof setInterval> | null = null;
	let presenceStatusHeartbeat: ReturnType<typeof setInterval> | null = null;
	let coupleRefreshHeartbeat: ReturnType<typeof setInterval> | null = null;
	let presenceSetupInProgress = false;
	let presenceCoupleId: string | null = null;
	let presencePartnerOnline = false;
	let presenceSubscribed = false;

	const PARTNER_ONLINE_GRACE_MS = 5 * 60 * 1000;

	function isRecentlyOnline(lastSeen: string | null | undefined): boolean {
		if (!lastSeen) return false;

		const lastSeenAt = new Date(lastSeen).getTime();

		if (Number.isNaN(lastSeenAt)) return false;

		return Date.now() - lastSeenAt <= PARTNER_ONLINE_GRACE_MS;
	}

	function refreshPartnerOnlineState() {
		if (presenceSubscribed) {
			coupleStore.isPartnerPresenceSynced = true;
			coupleStore.isPartnerOnline = presencePartnerOnline;
			return;
		}

		coupleStore.isPartnerPresenceSynced = false;
		coupleStore.isPartnerOnline = isRecentlyOnline(coupleStore.partnerLastSeen);
	}

	function clearPresenceChannel() {
		presencePartnerOnline = false;
		presenceSubscribed = false;
		presenceCoupleId = null;
		coupleStore.isPartnerPresenceSynced = false;

		if (presenceChannel) {
			supabase.removeChannel(presenceChannel);
			presenceChannel = null;
		}
	}

	function stopPresenceSchedulers() {
		if (presenceHeartbeat) {
			clearInterval(presenceHeartbeat);
			presenceHeartbeat = null;
		}

		if (presenceStatusHeartbeat) {
			clearInterval(presenceStatusHeartbeat);
			presenceStatusHeartbeat = null;
		}

		if (coupleRefreshHeartbeat) {
			clearInterval(coupleRefreshHeartbeat);
			coupleRefreshHeartbeat = null;
		}
	}

	async function triggerPresenceUpdate() {
		if (!browser || !authStore.isAuthenticated) return;
		await authService.updatePresence();
	}

	async function triggerCoupleRefresh() {
		if (!browser || !authStore.isAuthenticated) return;

		try {
			await coupleService.getMyCouple();
		} catch {
			// Keep the current store state if the refresh temporarily fails.
		}

		refreshPartnerOnlineState();
	}

	async function syncPresenceChannel() {
		if (!browser || !authStore.isAuthenticated) {
			clearPresenceChannel();
			return;
		}

		const coupleId = coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id;
		const partnerId = coupleStore.data?.partner?.id;
		const userId = authStore.user?.id;

		if (!coupleId || !partnerId || !userId) {
			refreshPartnerOnlineState();
			return;
		}

		if (presenceSetupInProgress) return;

		if (presenceChannel && presenceCoupleId === coupleId) {
			refreshPartnerOnlineState();
			return;
		}

		presenceSetupInProgress = true;

		try {
			clearPresenceChannel();
			presenceCoupleId = coupleId;

			const roomName = `presence_${coupleId}`;

			presenceChannel = supabase.channel(roomName, {
				config: { presence: { key: userId } }
			});

			presenceChannel
				.on('presence', { event: 'sync' }, () => {
					if (!presenceChannel) return;

					const state = presenceChannel.presenceState();
					presencePartnerOnline = !!state[partnerId]?.length;
					presenceSubscribed = true;
					refreshPartnerOnlineState();
				})
				.on('presence', { event: 'join' }, ({ key }: { key: string }) => {
					if (key === partnerId) {
						presencePartnerOnline = true;
						presenceSubscribed = true;
						refreshPartnerOnlineState();
					}
				})
				.on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
					if (key === partnerId) {
						presencePartnerOnline = false;
						presenceSubscribed = true;
						refreshPartnerOnlineState();
					}
				})
				.subscribe(async (status: string) => {
					if (status === 'SUBSCRIBED' && presenceChannel) {
						presenceSubscribed = true;
						await presenceChannel.track({
							online_at: new Date().toISOString()
						});
						refreshPartnerOnlineState();
					} else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
						presenceSubscribed = false;
						presencePartnerOnline = false;
						refreshPartnerOnlineState();
					}
				});

			refreshPartnerOnlineState();
		} finally {
			presenceSetupInProgress = false;
		}
	}

	onMount(() => {
		if (!browser) return;

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				void triggerPresenceUpdate();
				return;
			}
			void triggerCoupleRefresh();
			void syncPresenceChannel();
			refreshPartnerOnlineState();
		};

		const bootstrapPresence = async () => {
			if (!authStore.isAuthenticated) {
				clearPresenceChannel();
				coupleStore.isPartnerOnline = false;
				coupleStore.isPartnerPresenceSynced = false;
				return;
			}

			if (!authStore.user) {
				try {
					await authService.getMe();
				} catch {
					authService.logout();
					return;
				}
			}

			await triggerPresenceUpdate();
			await triggerCoupleRefresh();
			await syncPresenceChannel();
		};

		void bootstrapPresence();

		if (!presenceHeartbeat) {
			presenceHeartbeat = setInterval(triggerPresenceUpdate, 2 * 60 * 1000);
		}

		if (!presenceStatusHeartbeat) {
			presenceStatusHeartbeat = setInterval(refreshPartnerOnlineState, 30 * 1000);
		}

		if (!coupleRefreshHeartbeat) {
			coupleRefreshHeartbeat = setInterval(triggerCoupleRefresh, 60 * 1000);
		}

		window.addEventListener('beforeunload', triggerPresenceUpdate);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('beforeunload', triggerPresenceUpdate);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			stopPresenceSchedulers();
			clearPresenceChannel();
		};
	});

	// Reactive trigger when auth or couple data changes (replacing 1.5s interval polling)
	$effect(() => {
		if (browser && authStore.isAuthenticated && coupleStore.data && authStore.user?.id) {
			void syncPresenceChannel();
		} else if (browser && !authStore.isAuthenticated) {
			clearPresenceChannel();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div
	style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
	class="text-gray-900 bg-[#FFF7ED] min-h-screen selection:bg-[#F8B4C8] selection:text-white antialiased"
>
	<QueryClientProvider client={queryClient}>
		{@render children()}
	</QueryClientProvider>
</div>