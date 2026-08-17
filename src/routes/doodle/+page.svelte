<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	import { authStore } from '$lib/stores/auth.store.svelte';
	import { coupleStore } from '$lib/stores/couple.store.svelte';
	import { supabase } from '$lib/services/supabase.service';
	import { doodleService } from '$lib/services/doodle.service';
	import { exportCanvasToBlob } from '$lib/utils/canvas.utils';

	import type { DrawingTool, StrokePoint, StrokeRecord, BroadcastPayload, DoodleItem } from '$lib/types/doodle.types';

	import DoodleCanvas from '$lib/components/doodle/DoodleCanvas.svelte';
	import DoodleToolbar from '$lib/components/doodle/DoodleToolbar.svelte';
	import PartnerCursor from '$lib/components/doodle/PartnerCursor.svelte';
	import SaveDoodleModal from '$lib/components/doodle/SaveDoodleModal.svelte';
	import DoodleGallery from '$lib/components/doodle/DoodleGallery.svelte';

	let myId = $derived(authStore.user?.id || '');
	let myName = $derived(authStore.user?.name || 'Me');
	let partnerName = $derived(coupleStore.partner?.name || 'Partner');
	let coupleId = $derived(coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id || '');
	let isPartnerOnline = $derived(coupleStore.isPartnerOnline);

	let canvasComponent: DoodleCanvas | null = $state(null);

	// Drawing States
	let currentTool = $state<DrawingTool>('pen');
	let currentColor = $state<string>('#FB7185');
	let currentWidth = $state<number>(7);
	let strokes = $state<StrokeRecord[]>([]);
	let undoStack = $state<StrokeRecord[]>([]);
	let partnerActiveStroke = $state<StrokeRecord | null>(null);

	// Partner Cursor States
	let partnerX = $state<number>(0.5);
	let partnerY = $state<number>(0.5);
	let partnerIsDrawing = $state<boolean>(false);
	let partnerCursorVisible = $state<boolean>(false);
	let partnerCursorTimeout: ReturnType<typeof setTimeout> | null = null;

	// Realtime Channel
	let doodleChannel: RealtimeChannel | null = null;
	let isSubscribed = $state(false);
	let connectionStatus = $state<'connecting' | 'connected' | 'error'>('connecting');

	// Save & Gallery Modals
	let isSaveModalOpen = $state(false);
	let isSaving = $state(false);
	let savePreviewUrl = $state('');

	let isGalleryOpen = $state(false);
	let isGalleryLoading = $state(false);
	let galleryDoodles = $state<DoodleItem[]>([]);
	let toastMessage = $state<string | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string) {
		toastMessage = msg;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}

	function setupRealtime() {
		if (!browser || !coupleId || !myId) return;

		teardownRealtime();

		const roomName = `doodle_${coupleId}`;
		doodleChannel = supabase.channel(roomName, {
			config: { broadcast: { ack: false, self: false } }
		});

		doodleChannel
			.on('broadcast', { event: 'doodle_event' }, ({ payload }) => {
				handleIncomingBroadcast(payload as BroadcastPayload);
			})
			.subscribe((status) => {
				if (status === 'SUBSCRIBED') {
					isSubscribed = true;
					connectionStatus = 'connected';
				} else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
					isSubscribed = false;
					connectionStatus = 'error';
				}
			});
	}

	function teardownRealtime() {
		if (doodleChannel) {
			supabase.removeChannel(doodleChannel);
			doodleChannel = null;
		}
		isSubscribed = false;
	}

	function sendBroadcast(payload: BroadcastPayload) {
		if (!doodleChannel || !isSubscribed) return;
		doodleChannel.send({
			type: 'broadcast',
			event: 'doodle_event',
			payload
		});
	}

	function handleIncomingBroadcast(payload: BroadcastPayload) {
		if (!payload) return;

		switch (payload.type) {
			case 'stroke_start': {
				partnerActiveStroke = {
					...payload.stroke,
					points: [...payload.stroke.points]
				};
				break;
			}
			case 'stroke_chunk': {
				if (partnerActiveStroke && partnerActiveStroke.id === payload.strokeId) {
					partnerActiveStroke = {
						...partnerActiveStroke,
						points: [...partnerActiveStroke.points, ...payload.points]
					};
				}
				break;
			}
			case 'stroke_end': {
				if (partnerActiveStroke && partnerActiveStroke.id === payload.strokeId) {
					strokes = [...strokes, partnerActiveStroke];
					partnerActiveStroke = null;
				}
				break;
			}
			case 'action': {
				if (payload.action === 'clear') {
					strokes = [];
					undoStack = [];
					partnerActiveStroke = null;
					showToast(`${partnerName} cleared the canvas`);
				} else if (payload.action === 'undo') {
					if (strokes.length > 0) {
						const last = strokes[strokes.length - 1];
						strokes = strokes.slice(0, -1);
						undoStack = [...undoStack, last];
					}
				} else if (payload.action === 'redo') {
					if (undoStack.length > 0) {
						const next = undoStack[undoStack.length - 1];
						undoStack = undoStack.slice(0, -1);
						strokes = [...strokes, next];
					}
				}
				break;
			}
			case 'cursor_move': {
				partnerX = payload.x;
				partnerY = payload.y;
				partnerIsDrawing = payload.isDrawing;
				partnerCursorVisible = true;

				if (partnerCursorTimeout) clearTimeout(partnerCursorTimeout);
				partnerCursorTimeout = setTimeout(() => {
					partnerCursorVisible = false;
				}, 4000);
				break;
			}
		}
	}

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto(resolve('/login'));
			return;
		}

		if (!coupleStore.isActive) {
			goto(resolve('/join-couple'));
			return;
		}

		setupRealtime();

		return () => {
			teardownRealtime();
			if (partnerCursorTimeout) clearTimeout(partnerCursorTimeout);
			if (toastTimeout) clearTimeout(toastTimeout);
		};
	});

	// Canvas event handlers
	function handleStrokeStart(stroke: StrokeRecord) {
		sendBroadcast({
			type: 'stroke_start',
			stroke
		});
	}

	function handleStrokeChunk(strokeId: string, points: StrokePoint[]) {
		sendBroadcast({
			type: 'stroke_chunk',
			strokeId,
			points
		});
	}

	function handleStrokeComplete(stroke: StrokeRecord) {
		strokes = [...strokes, stroke];
		undoStack = []; // Reset redo stack on new action

		sendBroadcast({
			type: 'stroke_end',
			strokeId: stroke.id
		});
	}

	function handleCursorMove(x: number, y: number, isDrawing: boolean) {
		sendBroadcast({
			type: 'cursor_move',
			senderId: myId,
			senderName: myName,
			x,
			y,
			isDrawing
		});
	}

	function handleUndo() {
		if (strokes.length === 0) return;
		const lastStroke = strokes[strokes.length - 1];
		strokes = strokes.slice(0, -1);
		undoStack = [...undoStack, lastStroke];

		sendBroadcast({
			type: 'action',
			action: 'undo',
			strokeId: lastStroke.id,
			senderId: myId
		});
	}

	function handleRedo() {
		if (undoStack.length === 0) return;
		const nextStroke = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		strokes = [...strokes, nextStroke];

		sendBroadcast({
			type: 'action',
			action: 'redo',
			strokeId: nextStroke.id,
			senderId: myId
		});
	}

	function handleClear() {
		if (strokes.length === 0) return;
		if (!confirm('Clear the entire canvas for both of you?')) return;

		strokes = [];
		undoStack = [];
		partnerActiveStroke = null;

		sendBroadcast({
			type: 'action',
			action: 'clear',
			senderId: myId
		});
		showToast('Canvas cleared');
	}

	// Save Flow
	async function openSaveModal() {
		const canvasEl = canvasComponent?.getCanvasElement();
		if (!canvasEl) return;

		try {
			const blob = await exportCanvasToBlob(canvasEl, '#FFF7ED', 'image/webp', 0.9);
			savePreviewUrl = URL.createObjectURL(blob);
			isSaveModalOpen = true;
		} catch (error) {
			console.error('Failed to generate preview:', error);
			showToast('Failed to create canvas preview');
		}
	}

	async function handleSaveDoodle(title: string) {
		const canvasEl = canvasComponent?.getCanvasElement();
		if (!canvasEl) return;

		isSaving = true;
		try {
			const blob = await exportCanvasToBlob(canvasEl, '#FFF7ED', 'image/webp', 0.9);
			await doodleService.saveDoodle(blob, title, strokes.length);

			isSaveModalOpen = false;
			showToast('Masterpiece saved to Doodle Vault! ✨');
		} catch (error) {
			console.error('Failed to save doodle:', error);
			showToast('Failed to save doodle. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	// Gallery Flow
	async function openGallery() {
		isGalleryOpen = true;
		isGalleryLoading = true;
		try {
			galleryDoodles = await doodleService.getDoodles();
		} catch (error) {
			console.error('Failed to fetch doodles:', error);
			showToast('Failed to load saved doodles');
		} finally {
			isGalleryLoading = false;
		}
	}

	async function handleDeleteDoodle(id: string) {
		try {
			await doodleService.deleteDoodle(id);
			galleryDoodles = galleryDoodles.filter((d) => d.id !== id);
			showToast('Doodle deleted');
		} catch (error) {
			console.error('Failed to delete doodle:', error);
			showToast('Failed to delete doodle');
		}
	}
</script>

<div class="fixed inset-0 flex flex-col bg-[#FFF7ED] font-sans select-none overflow-hidden touch-none">
	<!-- HEADER BAR -->
	<header class="relative z-40 flex items-center justify-between px-5 pt-4 pb-2">
		<!-- Back Button -->
		<a
			aria-label="Back to dashboard"
			href={resolve('/dashboard')}
			class="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 border border-white text-gray-700 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-90"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
			</svg>
		</a>

		<!-- Connection & Partner Presence Pill -->
		<div
			class="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md"
		>
			<span class="relative flex h-2.5 w-2.5">
				{#if isPartnerOnline && isSubscribed}
					<span class="absolute inset-0 h-full w-full animate-ping rounded-full bg-rose-400 opacity-60"></span>
					<span class="relative h-2.5 w-2.5 rounded-full bg-rose-500"></span>
				{:else if isSubscribed}
					<span class="relative h-2.5 w-2.5 rounded-full bg-amber-400"></span>
				{:else}
					<span class="relative h-2.5 w-2.5 rounded-full bg-gray-400"></span>
				{/if}
			</span>

			<span class="text-[11px] font-black uppercase tracking-wider text-gray-700">
				{#if isPartnerOnline && isSubscribed}
					<span class="text-rose-600">{partnerName} is here 🎨</span>
				{:else if connectionStatus === 'error'}
					<span class="text-red-500">Offline Canvas</span>
				{:else}
					<span>Canvas Ready ✨</span>
				{/if}
			</span>
		</div>

		<!-- Action: Gallery Quick Launcher -->
		<button
			type="button"
			aria-label="Open Doodle Vault"
			onclick={openGallery}
			class="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 border border-white text-purple-600 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-90"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		</button>
	</header>

	<!-- TOAST NOTIFICATION -->
	{#if toastMessage}
		<div class="fixed top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
			<div
				class="animate-bounce rounded-full border border-white/80 bg-gray-900/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
			>
				{toastMessage}
			</div>
		</div>
	{/if}

	<!-- MAIN CANVAS SPACE -->
	<main class="relative flex-1 w-full overflow-hidden">
		<!-- Subtle decorative canvas grid watermark -->
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.035]"
			style="background-size: 24px 24px; background-image: radial-gradient(circle, #000 1px, transparent 1px);"
		></div>

		<!-- Partner Live Floating Cursor -->
		<PartnerCursor
			x={partnerX}
			y={partnerY}
			name={partnerName}
			isDrawing={partnerIsDrawing}
			visible={partnerCursorVisible}
		/>

		<!-- Empty state guidance if canvas has 0 strokes -->
		{#if strokes.length === 0 && !partnerActiveStroke}
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-40">
				<div class="text-4xl mb-2">✨</div>
				<p class="text-sm font-black text-gray-600">Our Shared Canvas</p>
				<p class="text-xs font-semibold text-gray-400 mt-0.5">
					Draw something cute, {partnerName} sees it live!
				</p>
			</div>
		{/if}

		<!-- HTML5 2-Layer Drawing Canvas -->
		<DoodleCanvas
			bind:this={canvasComponent}
			userId={myId}
			{currentTool}
			{currentColor}
			{currentWidth}
			{strokes}
			{partnerActiveStroke}
			onStrokeStart={handleStrokeStart}
			onStrokeChunk={handleStrokeChunk}
			onStrokeComplete={handleStrokeComplete}
			onCursorMove={handleCursorMove}
		/>
	</main>

	<!-- BOTTOM FLOATING TOOLBAR -->
	<DoodleToolbar
		{currentTool}
		{currentColor}
		{currentWidth}
		canUndo={strokes.length > 0}
		canRedo={undoStack.length > 0}
		strokeCount={strokes.length}
		onToolChange={(tool) => (currentTool = tool)}
		onColorChange={(color) => (currentColor = color)}
		onWidthChange={(w) => (currentWidth = w)}
		onUndo={handleUndo}
		onRedo={handleRedo}
		onClear={handleClear}
		onOpenGallery={openGallery}
		onOpenSave={openSaveModal}
	/>

	<!-- SAVE MODAL -->
	<SaveDoodleModal
		isOpen={isSaveModalOpen}
		previewUrl={savePreviewUrl}
		{isSaving}
		onSave={handleSaveDoodle}
		onClose={() => (isSaveModalOpen = false)}
	/>

	<!-- DOODLE GALLERY DRAWER -->
	<DoodleGallery
		isOpen={isGalleryOpen}
		doodles={galleryDoodles}
		isLoading={isGalleryLoading}
		onDelete={handleDeleteDoodle}
		onClose={() => (isGalleryOpen = false)}
	/>
</div>
