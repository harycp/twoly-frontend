<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { uiStore } from '$lib/stores/ui.store.svelte';

	const navItems = [
		{ name: 'Home', path: '/dashboard', icon: 'home' },
		{ name: 'Memories', path: '/memories', icon: 'polaroid' },
		{ name: 'Doodle', path: '/doodle', icon: 'brush', isSpecial: true },
		{ name: 'Plans', path: '/date-plans', icon: 'calendar' },
		{ name: 'More', path: '/settings', icon: 'menu' }
	] as const;

	let lastScrollY = $state(0);
	let isHiddenByScroll = $state(false);

	function handleScroll() {
		if (!browser) return;
		const currentScrollY = window.scrollY;

		if (currentScrollY < 60) {
			isHiddenByScroll = false;
			lastScrollY = currentScrollY;
			return;
		}

		if (currentScrollY > lastScrollY + 5) {
			isHiddenByScroll = true;
		} else if (currentScrollY < lastScrollY - 5) {
			isHiddenByScroll = false;
		}

		lastScrollY = currentScrollY;
	}

	let finalIsHidden = $derived(uiStore.isNavHidden || isHiddenByScroll);
	let isDoodleActive = $derived(page.url.pathname.startsWith('/doodle'));
</script>

<svelte:window onscroll={handleScroll} />

<nav
	class="fixed bottom-8 left-0 right-0 z-50 mx-auto w-[92%] max-w-95 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] {finalIsHidden
		? 'translate-y-[150%] opacity-0 pointer-events-none'
		: 'translate-y-0 opacity-100'}"
>
	<div
		class="relative flex h-18 w-full items-center justify-between rounded-[36px] border border-white/80 bg-white/85 shadow-[0_16px_40px_-10px_rgba(253,164,175,0.2)] backdrop-blur-2xl"
	>
		<div class="grid h-full w-full grid-cols-5 items-center justify-items-center">
			{#each navItems as item (item.path)}
				{#if 'isSpecial' in item && item.isSpecial}
					<div class="col-span-1 h-full w-full"></div>
				{:else}
					{@const isActive = page.url.pathname.startsWith(item.path)}

					<a
						href={resolve(item.path)}
						aria-label={item.name}
						class="group relative flex h-full w-full flex-col items-center justify-center outline-none"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 {isActive
								? 'bg-[#FDA4AF]/10'
								: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600'}"
						>
							{#if item.icon === 'home'}
								<svg
									class="h-6 w-6 transition-transform duration-300 {isActive ? 'scale-110' : ''}"
									fill="none"
									stroke={isActive ? '#FDA4AF' : 'currentColor'}
									stroke-width={isActive ? '2.6' : '2.2'}
									stroke-linecap="round"
									stroke-linejoin="round"
									viewBox="0 0 24 24"
								>
									<path
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									/>
								</svg>
							{:else if item.icon === 'polaroid'}
								<svg
									class="h-5.5 w-5.5 transition-transform duration-300 {isActive ? 'scale-110' : ''}"
									fill="none"
									stroke={isActive ? '#FDA4AF' : 'currentColor'}
									stroke-width={isActive ? '2.6' : '2.2'}
									stroke-linecap="round"
									stroke-linejoin="round"
									viewBox="0 0 24 24"
								>
									<path
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							{:else if item.icon === 'calendar'}
								<svg
									class="h-5.5 w-5.5 transition-transform duration-300 {isActive ? 'scale-110' : ''}"
									fill="none"
									stroke={isActive ? '#FDA4AF' : 'currentColor'}
									stroke-width={isActive ? '2.6' : '2.2'}
									stroke-linecap="round"
									stroke-linejoin="round"
									viewBox="0 0 24 24"
								>
									<path
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							{:else if item.icon === 'menu'}
								<svg
									class="h-6 w-6 transition-transform duration-300 {isActive ? 'scale-110' : ''}"
									fill="none"
									stroke={isActive ? '#FDA4AF' : 'currentColor'}
									stroke-width={isActive ? '3' : '2.2'}
									stroke-linecap="round"
									stroke-linejoin="round"
									viewBox="0 0 24 24"
								>
									<path d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							{/if}
						</div>

						<div
							class="absolute bottom-1.5 h-1.25 w-1.25 rounded-full bg-[#FDA4AF] transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] {isActive
								? 'scale-100 opacity-100 translate-y-0'
								: 'scale-0 opacity-0 translate-y-2'}"
						></div>
					</a>
				{/if}
			{/each}
		</div>

		<!-- CENTER DOODLE ACTION BUTTON -->
		<a
			href={resolve('/doodle')}
			aria-label="Shared Doodle Canvas"
			class="absolute left-1/2 -top-6 flex h-19.5 w-19.5 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[#FFF7ED] bg-linear-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-[0_12px_24px_-6px_rgba(253,164,175,0.6)] outline-none transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:shadow-[0_16px_32px_-6px_rgba(253,164,175,0.7)] active:scale-95 {isDoodleActive
				? 'ring-4 ring-rose-300/50 scale-105'
				: ''}"
		>
			<svg class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
				/>
			</svg>
		</a>
	</div>
</nav>