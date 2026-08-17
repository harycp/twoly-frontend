<script lang="ts">
	import { resolve } from '$app/paths';
	import type { DoodleItem } from '$lib/types/doodle.types';
	import { onMount } from 'svelte';

	interface Props {
		latestDoodle: DoodleItem | null;
		isPartnerOnline: boolean;
		partnerName: string;
	}

	let { latestDoodle, isPartnerOnline, partnerName }: Props = $props();

	// Mini Scratchpad state
	let miniCanvasRef: HTMLCanvasElement | null = $state(null);
	let isDrawing = false;
	let hasStrokes = $state(false);
	let activeTab = $state<'preview' | 'quick_draw'>('preview');

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	function setupMiniCanvas() {
		if (!miniCanvasRef) return;
		const rect = miniCanvasRef.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		miniCanvasRef.width = rect.width * dpr;
		miniCanvasRef.height = rect.height * dpr;
		const ctx = miniCanvasRef.getContext('2d');
		ctx?.scale(dpr, dpr);
	}

	onMount(() => {
		setupMiniCanvas();
	});

	function handlePointerDown(e: PointerEvent) {
		if (!miniCanvasRef) return;
		miniCanvasRef.setPointerCapture(e.pointerId);
		isDrawing = true;
		hasStrokes = true;
		const rect = miniCanvasRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const ctx = miniCanvasRef.getContext('2d');
		if (!ctx) return;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.strokeStyle = '#FB7185';
		ctx.lineWidth = 4;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDrawing || !miniCanvasRef) return;
		const rect = miniCanvasRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const ctx = miniCanvasRef.getContext('2d');
		if (!ctx) return;
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	function handlePointerUp(e: PointerEvent) {
		isDrawing = false;
		try {
			miniCanvasRef?.releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	}

	function clearMiniCanvas() {
		if (!miniCanvasRef) return;
		const ctx = miniCanvasRef.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, miniCanvasRef.width, miniCanvasRef.height);
		hasStrokes = false;
	}
</script>

<section
	class="group relative overflow-hidden rounded-[40px] border border-white/80 bg-white/70 p-6 shadow-[0_16px_48px_-16px_rgba(253,164,175,0.25)] backdrop-blur-2xl transition-all duration-300 hover:shadow-xl"
>
	<!-- Decorative soft ambient background glows -->
	<div
		class="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-linear-to-br from-[#FDA4AF]/20 to-[#F8B4C8]/10 blur-3xl pointer-events-none"
	></div>
	<div
		class="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-linear-to-tr from-[#DDD6FE]/30 to-[#FEE2E2]/20 blur-3xl pointer-events-none"
	></div>

	<!-- Top Header -->
	<div class="relative z-10 flex items-start justify-between">
		<div>
			<div class="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-100/80 px-3 py-1 mb-2">
				<span class="text-xs">🎨</span>
				<span class="text-[10px] font-black uppercase tracking-widest text-rose-500">Shared Canvas</span>
			</div>
			<h2 class="text-2xl font-black text-gray-900 tracking-tight">Our Sketchpad</h2>
			<p class="text-xs font-bold text-gray-400 mt-0.5">
				{#if isPartnerOnline}
					<span class="text-rose-500 font-extrabold">{partnerName} is online</span> • Draw together live!
				{:else}
					Draw & surprise {partnerName} anytime ✨
				{/if}
			</p>
		</div>

		<!-- Switch Tabs (Preview vs Quick Scratch) -->
		<div class="flex items-center rounded-2xl bg-gray-100/80 p-1 border border-white">
			<button
				type="button"
				onclick={() => (activeTab = 'preview')}
				class="rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all {activeTab ===
				'preview'
					? 'bg-white text-gray-900 shadow-xs'
					: 'text-gray-400 hover:text-gray-600'}"
			>
				Vault
			</button>
			<button
				type="button"
				onclick={() => {
					activeTab = 'quick_draw';
					setTimeout(setupMiniCanvas, 50);
				}}
				class="rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all {activeTab ===
				'quick_draw'
					? 'bg-white text-rose-600 shadow-xs'
					: 'text-gray-400 hover:text-gray-600'}"
			>
				Quick Draw
			</button>
		</div>
	</div>

	<!-- Main Card Content Body -->
	<div class="relative z-10 mt-5">
		{#if activeTab === 'preview'}
			<!-- Latest Doodle Vault Preview -->
			{#if latestDoodle}
				<div class="space-y-3">
					<div
						class="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-gray-100 bg-[#FFF7ED] shadow-inner"
					>
						<img
							src={latestDoodle.image_url}
							alt={latestDoodle.title || 'Latest Doodle'}
							class="h-full w-full object-contain p-2"
						/>

						{#if latestDoodle.title}
							<div
								class="absolute bottom-2.5 left-2.5 rounded-full bg-gray-900/80 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md"
							>
								{latestDoodle.title}
							</div>
						{/if}
					</div>

					<div class="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
						<span>Saved {formatDate(latestDoodle.created_at)}</span>
						{#if latestDoodle.saved_by_name}
							<span class="text-rose-400">by {latestDoodle.saved_by_name}</span>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Empty Vault State -->
				<div
					class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-200 bg-rose-50/40 py-10 px-4 text-center"
				>
					<div
						class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-rose-400 shadow-sm"
					>
						✨
					</div>
					<p class="text-sm font-black text-gray-800">No drawings in vault yet</p>
					<p class="text-xs font-bold text-gray-400 mt-0.5">Start drawing with your partner anytime!</p>
				</div>
			{/if}
		{:else}
			<!-- Quick Draw Interactive Scratchpad -->
			<div class="space-y-3">
				<div
					class="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-rose-200/80 bg-[#FFF7ED] shadow-inner cursor-crosshair touch-none"
				>
					<canvas
						bind:this={miniCanvasRef}
						onpointerdown={handlePointerDown}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
						class="h-full w-full touch-none select-none"
					></canvas>

					{#if !hasStrokes}
						<div class="pointer-events-none absolute inset-0 flex items-center justify-center text-center opacity-40">
							<p class="text-xs font-bold text-gray-400">✍️ Scribble anything here with your finger!</p>
						</div>
					{/if}

					{#if hasStrokes}
						<button
							type="button"
							onclick={clearMiniCanvas}
							class="absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-rose-500 shadow-sm backdrop-blur-sm active:scale-90"
						>
							Clear
						</button>
					{/if}
				</div>

				<p class="text-center text-[11px] font-bold text-gray-400">
					Want colors & realtime sync? Open full canvas below 👇
				</p>
			</div>
		{/if}
	</div>

	<!-- Bottom Action: Open Full Canvas -->
	<div class="relative z-10 mt-5 pt-1">
		<a
			href={resolve('/doodle')}
			class="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#FDA4AF] via-[#fb7185] to-[#f43f5e] py-3.5 text-xs font-black text-white shadow-lg shadow-rose-200 transition-all hover:scale-[1.01] hover:shadow-xl active:scale-95"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
				/>
			</svg>
			<span>Open Full Doodle Canvas 🎨</span>
		</a>
	</div>
</section>
