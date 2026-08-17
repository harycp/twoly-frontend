<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	import { authStore } from '$lib/stores/auth.store.svelte';
	import { coupleStore } from '$lib/stores/couple.store.svelte';
	import { supabase } from '$lib/services/supabase.service';
	import { doodleService } from '$lib/services/doodle.service';
	import { drawStroke, simplifyPoints, exportCanvasToBlob } from '$lib/utils/canvas.utils';

	import type { DrawingTool, StrokePoint, StrokeRecord, BroadcastPayload } from '$lib/types/doodle.types';

	interface Props {
		isPartnerOnline: boolean;
		partnerName: string;
	}

	let { isPartnerOnline, partnerName }: Props = $props();

	let myId = $derived(authStore.user?.id || '');
	let coupleId = $derived(coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id || '');

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let containerRef: HTMLDivElement | null = $state(null);

	let currentTool = $state<DrawingTool>('pen');
	let currentColor = $state<string>('#FB7185');
	let currentWidth = $state<number>(5);

	let strokes = $state<StrokeRecord[]>([]);
	let isDrawing = $state(false);
	let currentStrokeId = '';
	let currentPoints: StrokePoint[] = [];

	let isControlsHidden = $state(false);
	let isSaving = $state(false);
	let saveFeedback = $state<string | null>(null);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let syncDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

	let doodleChannel: RealtimeChannel | null = null;
	let partnerActiveStroke: StrokeRecord | null = $state(null);

	const presetColors = [
		'#1E293B', // Charcoal
		'#FB7185', // Twoly Rose
		'#E11D48', // Crimson
		'#8B5CF6', // Purple
		'#3B82F6', // Blue
		'#10B981', // Emerald
		'#F59E0B'  // Amber Gold
	];

	const sizePresets = [
		{ label: 'Fine', value: 3, dotClass: 'h-1.5 w-1.5' },
		{ label: 'Medium', value: 6, dotClass: 'h-2.5 w-2.5' },
		{ label: 'Bold', value: 12, dotClass: 'h-3.5 w-3.5' }
	];

	function showFeedback(msg: string) {
		saveFeedback = msg;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveFeedback = null;
		}, 3000);
	}

	function debounceSyncBackend() {
		if (syncDebounceTimeout) clearTimeout(syncDebounceTimeout);
		syncDebounceTimeout = setTimeout(async () => {
			try {
				await doodleService.syncActiveCanvas(strokes);
			} catch (e) {
				console.error('Failed to sync active canvas:', e);
			}
		}, 1000);
	}

	function redrawCanvas() {
		if (!canvasRef || !containerRef) return;
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		const rect = containerRef.getBoundingClientRect();
		ctx.clearRect(0, 0, rect.width, rect.height);

		for (const stroke of strokes) {
			drawStroke(ctx, stroke, rect.width, rect.height);
		}

		if (partnerActiveStroke) {
			drawStroke(ctx, partnerActiveStroke, rect.width, rect.height);
		}
	}

	function resizeCanvas() {
		if (!canvasRef || !containerRef) return;
		const rect = containerRef.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		canvasRef.width = rect.width * dpr;
		canvasRef.height = rect.height * dpr;

		const ctx = canvasRef.getContext('2d');
		ctx?.scale(dpr, dpr);
		redrawCanvas();
	}

	async function loadActiveCanvas() {
		try {
			const activeStrokes = await doodleService.getActiveCanvas();
			if (activeStrokes && activeStrokes.length > 0) {
				strokes = activeStrokes;
				redrawCanvas();
			}
		} catch (e) {
			console.error('Failed to load active canvas:', e);
		}
	}

	function setupRealtimeChannel() {
		if (!browser || !coupleId) return;

		const channelName = `doodle_${coupleId}`;
		doodleChannel = supabase.channel(channelName, {
			config: {
				broadcast: { self: false }
			}
		});

		doodleChannel
			.on('broadcast', { event: 'doodle_event' }, ({ payload }: { payload: BroadcastPayload }) => {
				if (!payload) return;

				if (payload.type === 'stroke_start') {
					partnerActiveStroke = {
						...payload.stroke,
						points: [...payload.stroke.points]
					};
					redrawCanvas();
				} else if (payload.type === 'stroke_chunk') {
					if (partnerActiveStroke && partnerActiveStroke.id === payload.strokeId) {
						partnerActiveStroke = {
							...partnerActiveStroke,
							points: [...partnerActiveStroke.points, ...payload.points]
						};
						redrawCanvas();
					}
				} else if (payload.type === 'stroke_end') {
					if (partnerActiveStroke && partnerActiveStroke.id === payload.strokeId) {
						strokes = [...strokes, partnerActiveStroke];
						partnerActiveStroke = null;
						redrawCanvas();
					}
				} else if (payload.type === 'action') {
					if (payload.action === 'undo') {
						strokes = strokes.slice(0, -1);
						redrawCanvas();
					} else if (payload.action === 'clear') {
						strokes = [];
						partnerActiveStroke = null;
						redrawCanvas();
					}
				}
			})
			.subscribe();
	}

	onMount(() => {
		resizeCanvas();
		loadActiveCanvas();
		setupRealtimeChannel();

		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			if (saveTimeout) clearTimeout(saveTimeout);
			if (syncDebounceTimeout) clearTimeout(syncDebounceTimeout);
			if (doodleChannel) {
				supabase.removeChannel(doodleChannel);
			}
		};
	});

	function getNormalizedCoords(e: PointerEvent): { x: number; y: number } {
		if (!containerRef) return { x: 0, y: 0 };
		const rect = containerRef.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
		return { x, y };
	}

	function handlePointerDown(e: PointerEvent) {
		if (!containerRef) return;
		containerRef.setPointerCapture(e.pointerId);
		isDrawing = true;

		currentStrokeId = `stroke_${Date.now()}_${myId}_${Math.random().toString(36).substring(2, 6)}`;
		const { x, y } = getNormalizedCoords(e);
		currentPoints = [{ x, y, p: e.pressure || 0.5 }];

		const tempStroke: StrokeRecord = {
			id: currentStrokeId,
			senderId: myId,
			tool: currentTool,
			color: currentColor,
			width: currentWidth,
			opacity: 1,
			points: [...currentPoints],
			timestamp: Date.now()
		};

		doodleChannel?.send({
			type: 'broadcast',
			event: 'doodle_event',
			payload: { type: 'stroke_start', stroke: tempStroke }
		});
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDrawing || !containerRef || !canvasRef) return;
		const { x, y } = getNormalizedCoords(e);
		const newPt: StrokePoint = { x, y, p: e.pressure || 0.5 };
		currentPoints.push(newPt);

		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;
		const rect = containerRef.getBoundingClientRect();

		ctx.clearRect(0, 0, rect.width, rect.height);
		for (const s of strokes) {
			drawStroke(ctx, s, rect.width, rect.height);
		}
		if (partnerActiveStroke) {
			drawStroke(ctx, partnerActiveStroke, rect.width, rect.height);
		}

		const tempStroke: StrokeRecord = {
			id: currentStrokeId,
			senderId: myId,
			tool: currentTool,
			color: currentColor,
			width: currentWidth,
			opacity: 1,
			points: currentPoints,
			timestamp: Date.now()
		};
		drawStroke(ctx, tempStroke, rect.width, rect.height);

		// Send stroke chunk to partner using consistent currentStrokeId
		if (currentPoints.length % 2 === 0) {
			doodleChannel?.send({
				type: 'broadcast',
				event: 'doodle_event',
				payload: {
					type: 'stroke_chunk',
					strokeId: currentStrokeId,
					points: [newPt]
				}
			});
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDrawing) return;
		isDrawing = false;

		try {
			containerRef?.releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}

		const { x, y } = getNormalizedCoords(e);
		currentPoints.push({ x, y, p: e.pressure || 0.5 });

		const simplified = simplifyPoints(currentPoints, 0.0015);
		const newStroke: StrokeRecord = {
			id: currentStrokeId,
			senderId: myId,
			tool: currentTool,
			color: currentColor,
			width: currentWidth,
			opacity: 1,
			points: simplified,
			timestamp: Date.now()
		};

		strokes = [...strokes, newStroke];
		currentPoints = [];
		redrawCanvas();

		doodleChannel?.send({
			type: 'broadcast',
			event: 'doodle_event',
			payload: { type: 'stroke_end', strokeId: currentStrokeId }
		});

		debounceSyncBackend();
	}

	function handleUndo() {
		if (strokes.length === 0) return;
		strokes = strokes.slice(0, -1);
		redrawCanvas();

		doodleChannel?.send({
			type: 'broadcast',
			event: 'doodle_event',
			payload: { type: 'action', action: 'undo', senderId: myId }
		});

		debounceSyncBackend();
	}

	function handleClear() {
		if (strokes.length === 0) return;
		strokes = [];
		partnerActiveStroke = null;
		currentPoints = [];
		redrawCanvas();

		doodleChannel?.send({
			type: 'broadcast',
			event: 'doodle_event',
			payload: { type: 'action', action: 'clear', senderId: myId }
		});

		debounceSyncBackend();
	}

	async function handleSave() {
		if (!canvasRef || strokes.length === 0 || isSaving) return;
		isSaving = true;

		try {
			const blob = await exportCanvasToBlob(canvasRef, '#FFF7ED', 'image/webp', 0.9);
			await doodleService.saveDoodle(blob, 'Quick Sketch from Dashboard', strokes.length);
			showFeedback('Saved to Doodle Vault');
		} catch (error) {
			console.error('Failed to save sketch:', error);
			showFeedback('Failed to save');
		} finally {
			isSaving = false;
		}
	}
</script>

<section
	class="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_-16px_rgba(253,164,175,0.22)] backdrop-blur-xl transition-all duration-300"
>
	<!-- Ambient Background Glows -->
	<div
		class="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-linear-to-br from-[#FDA4AF]/20 to-transparent blur-2xl pointer-events-none"
	></div>
	<div
		class="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-linear-to-tr from-[#DDD6FE]/20 to-transparent blur-2xl pointer-events-none"
	></div>

	<!-- Top Header (Icon + Title on Left, Controls Toggle & Fullscreen on Right) -->
	<div class="relative z-10 flex items-center justify-between pb-3">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 shadow-xs">
				<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
				</svg>
			</div>
			<div>
				<h2 class="text-base font-black text-gray-900 tracking-tight leading-none">Shared Sketchpad</h2>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Toggle Tools (Maximize Canvas Area) -->
			<button
				type="button"
				aria-label={isControlsHidden ? 'Show Tools' : 'Hide Tools'}
				onclick={() => {
					isControlsHidden = !isControlsHidden;
					setTimeout(resizeCanvas, 60);
				}}
				class="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100/90 border border-white text-gray-500 shadow-xs transition-all hover:bg-gray-200 active:scale-90"
				title={isControlsHidden ? 'Show Tools' : 'Hide Tools'}
			>
				{#if isControlsHidden}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				{/if}
			</button>

			<!-- Direct Link to Full Page Canvas (SVG Icon only) -->
			<a
				href={resolve('/doodle')}
				aria-label="Open Full Canvas"
				class="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80 text-rose-600 shadow-xs transition-all hover:bg-rose-100 hover:scale-105 active:scale-90"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
				</svg>
			</a>
		</div>
	</div>

	<!-- Interactive Drawing Canvas -->
	<div
		bind:this={containerRef}
		role="application"
		aria-label="Interactive sketch canvas"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		class="relative w-full touch-none select-none overflow-hidden rounded-2xl border border-gray-100 bg-[#FFF7ED] shadow-inner cursor-crosshair transition-all duration-300 {isControlsHidden ? 'h-[400px] sm:h-[460px]' : 'h-[320px] sm:h-[380px]'}"
	>
		<!-- Subtle dot grid background -->
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.03]"
			style="background-size: 18px 18px; background-image: radial-gradient(circle, #000 1px, transparent 1px);"
		></div>

		<canvas bind:this={canvasRef} class="absolute inset-0 h-full w-full pointer-events-none"></canvas>

		{#if strokes.length === 0 && !isDrawing && !partnerActiveStroke}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center text-center opacity-40">
				<p class="text-xs font-bold text-gray-400">Sketch here with your finger</p>
			</div>
		{/if}

		{#if saveFeedback}
			<div class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20">
				<div class="rounded-full bg-gray-900/90 px-3 py-1 text-[10px] font-black text-white shadow-md backdrop-blur-xs">
					{saveFeedback}
				</div>
			</div>
		{/if}
	</div>

	<!-- Minimalist Compact Toolbar Controls (Collapsible) -->
	{#if !isControlsHidden}
		<div transition:slide={{ duration: 200 }} class="relative z-10 mt-3.5 space-y-2.5">
			<!-- Tools, Size, and Colors Row -->
			<div class="flex items-center justify-between gap-2">
				<!-- Tool Switcher -->
				<div class="flex items-center rounded-xl bg-gray-100/90 p-0.5 border border-white">
					<!-- Pen -->
					<button
						type="button"
						aria-label="Pen"
						onclick={() => (currentTool = 'pen')}
						class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {currentTool === 'pen'
							? 'bg-white text-rose-600 shadow-xs'
							: 'text-gray-400 hover:text-gray-700'}"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>

					<!-- Brush -->
					<button
						type="button"
						aria-label="Brush"
						onclick={() => (currentTool = 'brush')}
						class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {currentTool === 'brush'
							? 'bg-white text-rose-600 shadow-xs'
							: 'text-gray-400 hover:text-gray-700'}"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4 5 5 0 014-5h10a5 5 0 014 5 4 4 0 01-4 4H7zM16 12V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v8" />
						</svg>
					</button>

					<!-- Eraser -->
					<button
						type="button"
						aria-label="Eraser"
						onclick={() => (currentTool = 'eraser')}
						class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {currentTool === 'eraser'
							? 'bg-white text-rose-600 shadow-xs'
							: 'text-gray-400 hover:text-gray-700'}"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>

				<!-- Color Palette Dots -->
				<div class="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 hide-scrollbar">
					{#each presetColors as color (color)}
						{@const isSelected = currentColor.toLowerCase() === color.toLowerCase()}
						<button
							type="button"
							aria-label="Color {color}"
							onclick={() => {
								currentColor = color;
								if (currentTool === 'eraser') currentTool = 'pen';
							}}
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 {isSelected
								? 'scale-115 ring-2 ring-rose-400 ring-offset-1'
								: 'hover:scale-105'}"
							style="background-color: {color};"
						>
							{#if isSelected}
								<svg class="h-3 w-3 text-white drop-shadow-xs" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Stroke Width Presets -->
				<div class="flex items-center gap-1 rounded-xl bg-gray-100/90 p-0.5 border border-white">
					{#each sizePresets as preset (preset.value)}
						{@const isSelected = currentWidth === preset.value}
						<button
							type="button"
							aria-label="Stroke {preset.label}"
							onclick={() => (currentWidth = preset.value)}
							class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {isSelected
								? 'bg-white text-rose-600 shadow-xs'
								: 'text-gray-400 hover:text-gray-700'}"
						>
							<span class="{preset.dotClass} rounded-full bg-current"></span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Action Buttons Row (Undo, Clear, Save) -->
			<div class="flex items-center justify-between pt-0.5">
				<div class="flex items-center gap-1.5">
					<!-- Undo -->
					<button
						type="button"
						aria-label="Undo"
						onclick={handleUndo}
						disabled={strokes.length === 0}
						class="flex h-8 items-center gap-1 rounded-xl bg-gray-100/80 px-2.5 text-[11px] font-bold text-gray-600 hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
						</svg>
						<span>Undo</span>
					</button>

					<!-- Clear -->
					<button
						type="button"
						aria-label="Clear Canvas"
						onclick={handleClear}
						disabled={strokes.length === 0}
						class="flex h-8 items-center gap-1 rounded-xl bg-gray-100/80 px-2.5 text-[11px] font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span>Clear</span>
					</button>
				</div>

				<!-- Save Button -->
				<button
					type="button"
					onclick={handleSave}
					disabled={strokes.length === 0 || isSaving}
					class="flex h-8 items-center gap-1.5 rounded-xl bg-linear-to-r from-rose-500 to-pink-500 px-3.5 text-[11px] font-black text-white shadow-sm shadow-rose-200 transition-all hover:from-rose-600 hover:to-pink-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
				>
					{#if isSaving}
						<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						<span>Saving...</span>
					{:else}
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
						</svg>
						<span>Save Sketch</span>
					{/if}
				</button>
			</div>
		</div>
	{/if}
</section>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
