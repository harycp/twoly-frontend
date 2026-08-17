<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { DoodleItem } from '$lib/types/doodle.types';

	interface Props {
		isOpen: boolean;
		doodles: DoodleItem[];
		isLoading: boolean;
		onDelete: (id: string) => void;
		onClose: () => void;
	}

	let { isOpen, doodles, isLoading, onDelete, onClose }: Props = $props();

	let selectedDoodle = $state<DoodleItem | null>(null);
	let isDeleting = $state(false);

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this doodle?')) return;
		isDeleting = true;
		try {
			await onDelete(id);
			if (selectedDoodle?.id === id) {
				selectedDoodle = null;
			}
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		aria-label="Close drawer"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs border-0 outline-none"
	></button>

	<!-- Drawer Container -->
	<div
		transition:fly={{ y: 400, duration: 300 }}
		class="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[82vh] max-w-lg flex-col rounded-t-[40px] border-t border-white/60 bg-[#FFF7ED] shadow-2xl"
	>
		<!-- Handle Bar -->
		<div class="flex justify-center pt-3 pb-2">
			<div class="h-1.5 w-12 rounded-full bg-gray-300"></div>
		</div>

		<!-- Header -->
		<div class="flex items-center justify-between px-6 pb-4">
			<div>
				<h2 class="text-2xl font-black text-gray-900 tracking-tight">Doodle Vault 🎨</h2>
				<p class="text-xs font-bold text-gray-400">All the cute drawings you created together</p>
			</div>
			<button
				type="button"
				aria-label="Close Gallery"
				onclick={onClose}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm hover:text-gray-700 active:scale-90"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content / Grid -->
		<div class="flex-1 overflow-y-auto px-6 pb-8">
			{#if isLoading}
				<div class="grid grid-cols-2 gap-3 pt-2">
					<div class="aspect-square animate-pulse rounded-3xl bg-white/70 shadow-sm"></div>
					<div class="aspect-square animate-pulse rounded-3xl bg-white/70 shadow-sm"></div>
					<div class="aspect-square animate-pulse rounded-3xl bg-white/70 shadow-sm"></div>
					<div class="aspect-square animate-pulse rounded-3xl bg-white/70 shadow-sm"></div>
				</div>
			{:else if doodles.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div
						class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-rose-300 shadow-md"
					>
						<svg class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</div>
					<h3 class="text-base font-black text-gray-800">No doodles saved yet</h3>
					<p class="mt-1 text-xs font-bold text-gray-400">Start drawing on the canvas and tap Save!</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3 pt-2">
					{#each doodles as doodle (doodle.id)}
						<button
							type="button"
							onclick={() => (selectedDoodle = doodle)}
							class="group relative flex flex-col overflow-hidden rounded-[28px] border border-white bg-white p-2.5 text-left shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95"
						>
							<div
								class="aspect-square w-full overflow-hidden rounded-[20px] bg-[#FFF7ED] shadow-inner"
							>
								<img
									src={doodle.thumbnail_url || doodle.image_url}
									alt={doodle.title || 'Doodle'}
									class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
									loading="lazy"
								/>
							</div>

							<div class="p-1 pt-2">
								<p class="truncate text-xs font-black text-gray-900">
									{doodle.title || 'Untitled Doodle'}
								</p>
								<div class="mt-0.5 flex items-center justify-between text-[10px] font-bold text-gray-400">
									<span>{formatDate(doodle.created_at)}</span>
									{#if doodle.saved_by_name}
										<span class="truncate max-w-16 text-rose-400">by {doodle.saved_by_name}</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Full Preview Modal -->
{#if selectedDoodle}
	<div
		transition:fade={{ duration: 180 }}
		class="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
	>
		<div
			transition:fly={{ y: 20, duration: 250 }}
			class="relative w-full max-w-md overflow-hidden rounded-[36px] bg-white p-5 shadow-2xl"
		>
			<div class="flex items-center justify-between pb-3">
				<div>
					<h3 class="text-lg font-black text-gray-900 tracking-tight">
						{selectedDoodle.title || 'Untitled Doodle'}
					</h3>
					<p class="text-xs font-bold text-gray-400">
						Created on {formatDate(selectedDoodle.created_at)}
					</p>
				</div>
				<button
					type="button"
					aria-label="Close Preview"
					onclick={() => (selectedDoodle = null)}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Image -->
			<div
				class="my-2 max-h-[50vh] w-full overflow-hidden rounded-2xl bg-[#FFF7ED] border border-gray-100 flex items-center justify-center shadow-inner"
			>
				<img
					src={selectedDoodle.image_url}
					alt={selectedDoodle.title || 'Doodle'}
					class="max-h-[50vh] w-full object-contain"
				/>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2 pt-3">
				<a
					href={selectedDoodle.image_url}
					download={`doodle_${selectedDoodle.id}.webp`}
					target="_blank"
					class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700 hover:bg-gray-200 active:scale-95"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					<span>Download</span>
				</a>

				<button
					type="button"
					aria-label="Delete doodle"
					onclick={() => selectedDoodle && handleDelete(selectedDoodle.id)}
					disabled={isDeleting}
					class="flex items-center justify-center rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-100 active:scale-95 disabled:opacity-50"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
