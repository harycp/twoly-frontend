<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import type { DrawingTool } from '$lib/types/doodle.types';
	import ColorPicker from './ColorPicker.svelte';

	interface Props {
		currentTool: DrawingTool;
		currentColor: string;
		currentWidth: number;
		canUndo: boolean;
		canRedo: boolean;
		strokeCount: number;
		onToolChange: (tool: DrawingTool) => void;
		onColorChange: (color: string) => void;
		onWidthChange: (width: number) => void;
		onUndo: () => void;
		onRedo: () => void;
		onClear: () => void;
		onOpenGallery: () => void;
		onOpenSave: () => void;
	}

	let {
		currentTool,
		currentColor,
		currentWidth,
		canUndo,
		canRedo,
		strokeCount,
		onToolChange,
		onColorChange,
		onWidthChange,
		onUndo,
		onRedo,
		onClear,
		onOpenGallery,
		onOpenSave
	}: Props = $props();

	const widthPresets = [
		{ label: 'S', value: 3, dotSize: 'h-1.5 w-1.5' },
		{ label: 'M', value: 7, dotSize: 'h-2.5 w-2.5' },
		{ label: 'L', value: 14, dotSize: 'h-4 w-4' }
	];

	let isCollapsed = $state(false);
</script>

{#if isCollapsed}
	<!-- Minimized Floating Action Pill (Maximize Screen Space) -->
	<div
		transition:scale={{ duration: 200 }}
		class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 p-2 shadow-[0_16px_40px_-10px_rgba(253,164,175,0.35)] backdrop-blur-2xl transition-all hover:scale-105 select-none"
	>
		<!-- Active Tool & Color Preview -->
		<div class="flex items-center gap-2 pl-2 pr-1">
			<span class="h-3 w-3 rounded-full shadow-xs ring-1 ring-black/10" style="background-color: {currentColor};"></span>
			<span class="text-[10px] font-black uppercase tracking-wider text-gray-700">{currentTool}</span>
		</div>

		<!-- Expand Button -->
		<button
			type="button"
			aria-label="Show Drawing Tools"
			onclick={() => (isCollapsed = false)}
			class="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-rose-500 to-pink-500 text-white shadow-sm transition-transform active:scale-90"
		>
			<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
			</svg>
		</button>
	</div>
{:else}
	<!-- Expanded Full Drawing Toolbar -->
	<div
		transition:fly={{ y: 60, duration: 250 }}
		class="fixed bottom-6 left-0 right-0 z-40 mx-auto w-[94%] max-w-md space-y-2 select-none"
	>
		<!-- Top Row: Floating Color & Size Panel + Collapse Trigger -->
		<div
			class="flex items-center justify-between rounded-3xl border border-white/80 bg-white/90 p-2 shadow-[0_12px_32px_-8px_rgba(253,164,175,0.25)] backdrop-blur-2xl transition-all duration-300"
		>
			<!-- Color Palette -->
			<div class="flex-1 overflow-hidden pr-2">
				<ColorPicker
					selectedColor={currentColor}
					onSelect={(color) => {
						onColorChange(color);
						if (currentTool === 'eraser') onToolChange('pen');
					}}
				/>
			</div>

			<!-- Divider -->
			<div class="h-6 w-px bg-gray-200/80"></div>

			<!-- Stroke Width Presets -->
			<div class="flex items-center gap-1 px-1.5">
				{#each widthPresets as preset (preset.value)}
					{@const isSelected = currentWidth === preset.value}
					<button
						type="button"
						aria-label="Stroke size {preset.label}"
						onclick={() => onWidthChange(preset.value)}
						class="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 {isSelected
							? 'bg-rose-100/80 text-rose-600 font-bold shadow-xs'
							: 'text-gray-400 hover:bg-gray-100'}"
					>
						<span class="{preset.dotSize} rounded-full bg-current"></span>
					</button>
				{/each}
			</div>

			<!-- Divider -->
			<div class="h-6 w-px bg-gray-200/80"></div>

			<!-- Minimize / Hide Button -->
			<button
				type="button"
				aria-label="Hide Drawing Tools"
				onclick={() => (isCollapsed = true)}
				class="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100/80 text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-700 active:scale-90"
				title="Hide tools to maximize screen"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>

		<!-- Bottom Row: Primary Tools & Actions Glass Bar -->
		<div
			class="flex items-center justify-between rounded-3xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_16px_40px_-10px_rgba(253,164,175,0.3)] backdrop-blur-2xl"
		>
			<!-- Drawing Tools (Pen / Brush / Eraser) -->
			<div class="flex items-center gap-1">
				<!-- Pen -->
				<button
					type="button"
					aria-label="Pen Tool"
					onclick={() => onToolChange('pen')}
					class="flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-90 {currentTool ===
					'pen'
						? 'bg-linear-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-md shadow-rose-200'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
				</button>

				<!-- Brush -->
				<button
					type="button"
					aria-label="Brush Tool"
					onclick={() => onToolChange('brush')}
					class="flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-90 {currentTool ===
					'brush'
						? 'bg-linear-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-md shadow-rose-200'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7 21a4 4 0 01-4-4 5 5 0 014-5h10a5 5 0 014 5 4 4 0 01-4 4H7zM16 12V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v8"
						/>
					</svg>
				</button>

				<!-- Eraser -->
				<button
					type="button"
					aria-label="Eraser Tool"
					onclick={() => onToolChange('eraser')}
					class="flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-90 {currentTool ===
					'eraser'
						? 'bg-linear-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-md shadow-rose-200'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>

			<!-- Vertical Divider -->
			<div class="h-6 w-px bg-gray-200/80"></div>

			<!-- Canvas Actions (Undo, Redo, Clear) -->
			<div class="flex items-center gap-0.5">
				<!-- Undo -->
				<button
					type="button"
					aria-label="Undo"
					onclick={onUndo}
					disabled={!canUndo}
					class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
				>
					<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
					</svg>
				</button>

				<!-- Redo -->
				<button
					type="button"
					aria-label="Redo"
					onclick={onRedo}
					disabled={!canRedo}
					class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
				>
					<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
					</svg>
				</button>

				<!-- Clear Canvas -->
				<button
					type="button"
					aria-label="Clear Canvas"
					onclick={onClear}
					disabled={strokeCount === 0}
					class="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition-all hover:bg-rose-50 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
				>
					<svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>
			</div>

			<!-- Vertical Divider -->
			<div class="h-6 w-px bg-gray-200/80"></div>

			<!-- Persistent & Gallery Actions -->
			<div class="flex items-center gap-1.5">
				<!-- Gallery Drawer Button -->
				<button
					type="button"
					aria-label="Doodle Gallery"
					onclick={onOpenGallery}
					class="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-all hover:bg-purple-100 active:scale-90 shadow-xs"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</button>

				<!-- Save Doodle Button -->
				<button
					type="button"
					aria-label="Save Doodle"
					onclick={onOpenSave}
					disabled={strokeCount === 0}
					class="flex items-center gap-1.5 rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-rose-200 transition-all hover:from-rose-600 hover:to-pink-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
					</svg>
					<span>Save</span>
				</button>
			</div>
		</div>
	</div>
{/if}
