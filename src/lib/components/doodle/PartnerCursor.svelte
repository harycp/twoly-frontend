<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Props {
		x: number; // 0-1 normalized
		y: number; // 0-1 normalized
		name: string;
		isDrawing: boolean;
		visible: boolean;
	}

	let { x, y, name, isDrawing, visible }: Props = $props();
</script>

{#if visible}
	<div
		transition:fade={{ duration: 200 }}
		class="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
		style="left: {x * 100}%; top: {y * 100}%;"
	>
		<!-- Cursor Ripple if Drawing -->
		{#if isDrawing}
			<div
				in:scale={{ duration: 150 }}
				class="absolute -inset-3 animate-ping rounded-full bg-rose-400/40"
			></div>
		{/if}

		<!-- Center dot / Pencil pointer -->
		<div class="relative flex items-center justify-center">
			<div
				class="h-4 w-4 rounded-full border-2 border-white bg-rose-500 shadow-md transition-transform duration-150 {isDrawing
					? 'scale-125'
					: 'scale-100'}"
			></div>

			<!-- Partner Name Badge -->
			<div
				class="absolute left-5 top-0 flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-900/85 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm border border-white/20"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
				<span>{name || 'Partner'}</span>
				{#if isDrawing}
					<svg class="h-2.5 w-2.5 text-rose-300 animate-pulse" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					</svg>
				{/if}
			</div>
		</div>
	</div>
{/if}
