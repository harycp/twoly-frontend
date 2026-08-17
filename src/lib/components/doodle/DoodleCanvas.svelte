<script lang="ts">
	import { onMount } from 'svelte';
	import type { DrawingTool, StrokePoint, StrokeRecord } from '$lib/types/doodle.types';
	import { drawStroke, simplifyPoints } from '$lib/utils/canvas.utils';

	interface Props {
		userId: string;
		currentTool: DrawingTool;
		currentColor: string;
		currentWidth: number;
		strokes: StrokeRecord[];
		partnerActiveStroke: StrokeRecord | null;
		onStrokeComplete: (stroke: StrokeRecord) => void;
		onStrokeChunk: (strokeId: string, chunk: StrokePoint[]) => void;
		onStrokeStart: (stroke: StrokeRecord) => void;
		onCursorMove: (x: number, y: number, isDrawing: boolean) => void;
	}

	let {
		userId,
		currentTool,
		currentColor,
		currentWidth,
		strokes,
		partnerActiveStroke,
		onStrokeComplete,
		onStrokeChunk,
		onStrokeStart,
		onCursorMove
	}: Props = $props();

	let containerRef: HTMLDivElement | null = $state(null);
	let baseCanvasRef: HTMLCanvasElement | null = $state(null);
	let activeCanvasRef: HTMLCanvasElement | null = $state(null);

	let canvasWidth = $state(800);
	let canvasHeight = $state(1200);

	let isDrawing = false;
	let currentStrokeId = '';
	let currentPoints: StrokePoint[] = [];
	let lastChunkIndex = 0;
	let chunkInterval: ReturnType<typeof setInterval> | null = null;
	let lastCursorSend = 0;

	// Redraw base canvas whenever committed strokes change
	$effect(() => {
		const baseCtx = baseCanvasRef?.getContext('2d');
		if (!baseCtx || !baseCanvasRef) return;

		baseCtx.clearRect(0, 0, baseCanvasRef.width, baseCanvasRef.height);

		// Render all committed strokes
		for (const stroke of strokes) {
			drawStroke(baseCtx, stroke, canvasWidth, canvasHeight);
		}
	});

	// Redraw active canvas whenever partner active stroke or local stroke changes
	$effect(() => {
		const activeCtx = activeCanvasRef?.getContext('2d');
		if (!activeCtx || !activeCanvasRef) return;

		activeCtx.clearRect(0, 0, activeCanvasRef.width, activeCanvasRef.height);

		// 1. Draw local active stroke in progress
		if (isDrawing && currentPoints.length > 0) {
			const localStroke: StrokeRecord = {
				id: currentStrokeId,
				senderId: userId,
				tool: currentTool,
				color: currentColor,
				width: currentWidth,
				opacity: 1,
				points: currentPoints,
				timestamp: Date.now()
			};
			drawStroke(activeCtx, localStroke, canvasWidth, canvasHeight);
		}

		// 2. Draw partner active stroke in progress
		if (partnerActiveStroke && partnerActiveStroke.points.length > 0) {
			drawStroke(activeCtx, partnerActiveStroke, canvasWidth, canvasHeight);
		}
	});

	function resizeCanvas() {
		if (!containerRef || !baseCanvasRef || !activeCanvasRef) return;
		const rect = containerRef.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile performance

		canvasWidth = rect.width;
		canvasHeight = rect.height;

		baseCanvasRef.width = rect.width * dpr;
		baseCanvasRef.height = rect.height * dpr;
		activeCanvasRef.width = rect.width * dpr;
		activeCanvasRef.height = rect.height * dpr;

		const baseCtx = baseCanvasRef.getContext('2d');
		const activeCtx = activeCanvasRef.getContext('2d');

		baseCtx?.scale(dpr, dpr);
		activeCtx?.scale(dpr, dpr);

		// Re-render base canvas
		if (baseCtx) {
			baseCtx.clearRect(0, 0, canvasWidth, canvasHeight);
			for (const stroke of strokes) {
				drawStroke(baseCtx, stroke, canvasWidth, canvasHeight);
			}
		}
	}

	onMount(() => {
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			if (chunkInterval) clearInterval(chunkInterval);
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
		currentStrokeId = `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const { x, y } = getNormalizedCoords(e);
		currentPoints = [{ x, y, p: e.pressure || 0.5 }];
		lastChunkIndex = 0;

		const initialStroke: StrokeRecord = {
			id: currentStrokeId,
			senderId: userId,
			tool: currentTool,
			color: currentColor,
			width: currentWidth,
			opacity: 1,
			points: [...currentPoints],
			timestamp: Date.now()
		};

		onStrokeStart(initialStroke);
		onCursorMove(x, y, true);

		// Setup interval to broadcast chunks every 45ms for high FPS realtime feel
		if (chunkInterval) clearInterval(chunkInterval);
		chunkInterval = setInterval(() => {
			if (!isDrawing) return;
			if (currentPoints.length > lastChunkIndex) {
				const chunk = currentPoints.slice(lastChunkIndex);
				lastChunkIndex = currentPoints.length - 1; // Overlap 1 point for continuous curve
				if (chunk.length > 0) {
					onStrokeChunk(currentStrokeId, chunk);
				}
			}
		}, 45);
	}

	function handlePointerMove(e: PointerEvent) {
		const { x, y } = getNormalizedCoords(e);

		// Throttle cursor move broadcasting (~60ms)
		const now = performance.now();
		if (now - lastCursorSend > 60) {
			lastCursorSend = now;
			onCursorMove(x, y, isDrawing);
		}

		if (!isDrawing) return;

		currentPoints.push({ x, y, p: e.pressure || 0.5 });

		// Fast render to active canvas
		const activeCtx = activeCanvasRef?.getContext('2d');
		if (activeCtx) {
			activeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
			const stroke: StrokeRecord = {
				id: currentStrokeId,
				senderId: userId,
				tool: currentTool,
				color: currentColor,
				width: currentWidth,
				opacity: 1,
				points: currentPoints,
				timestamp: Date.now()
			};
			drawStroke(activeCtx, stroke, canvasWidth, canvasHeight);

			if (partnerActiveStroke && partnerActiveStroke.points.length > 0) {
				drawStroke(activeCtx, partnerActiveStroke, canvasWidth, canvasHeight);
			}
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDrawing) return;
		isDrawing = false;

		if (chunkInterval) {
			clearInterval(chunkInterval);
			chunkInterval = null;
		}

		try {
			containerRef?.releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}

		const { x, y } = getNormalizedCoords(e);
		currentPoints.push({ x, y, p: e.pressure || 0.5 });

		// Simplify points with RDP to save memory while keeping visual beauty
		const simplified = simplifyPoints(currentPoints, 0.0012);

		const finalStroke: StrokeRecord = {
			id: currentStrokeId,
			senderId: userId,
			tool: currentTool,
			color: currentColor,
			width: currentWidth,
			opacity: 1,
			points: simplified,
			timestamp: Date.now()
		};

		currentPoints = [];
		onStrokeComplete(finalStroke);
		onCursorMove(x, y, false);

		// Clear active canvas
		const activeCtx = activeCanvasRef?.getContext('2d');
		if (activeCtx) {
			activeCtx.clearRect(0, 0, canvasWidth, canvasHeight);
			if (partnerActiveStroke && partnerActiveStroke.points.length > 0) {
				drawStroke(activeCtx, partnerActiveStroke, canvasWidth, canvasHeight);
			}
		}
	}

	export function getCanvasElement(): HTMLCanvasElement | null {
		return baseCanvasRef;
	}
</script>

<div
	bind:this={containerRef}
	role="application"
	aria-label="Drawing canvas"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	class="relative h-full w-full touch-none select-none cursor-crosshair overflow-hidden"
>
	<!-- Base Layer (Committed History) -->
	<canvas
		bind:this={baseCanvasRef}
		class="absolute inset-0 h-full w-full pointer-events-none"
	></canvas>

	<!-- Active Layer (Live Drawing In-Progress) -->
	<canvas
		bind:this={activeCanvasRef}
		class="absolute inset-0 h-full w-full pointer-events-none"
	></canvas>
</div>
