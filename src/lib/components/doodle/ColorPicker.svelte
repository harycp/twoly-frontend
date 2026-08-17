<script lang="ts">
	interface Props {
		selectedColor: string;
		onSelect: (color: string) => void;
	}

	let { selectedColor, onSelect }: Props = $props();

	const presetColors = [
		'#1E293B', // Charcoal / Black
		'#FB7185', // Twoly Rose / Coral
		'#E11D48', // Deep Crimson
		'#EC4899', // Pink
		'#8B5CF6', // Purple
		'#3B82F6', // Blue
		'#10B981', // Emerald
		'#F59E0B', // Amber Gold
		'#FFFFFF'  // White
	];

	let customInputRef: HTMLInputElement | null = null;
</script>

<div class="flex items-center gap-1.5 overflow-x-auto py-1 px-1 hide-scrollbar">
	{#each presetColors as color (color)}
		{@const isSelected = selectedColor.toLowerCase() === color.toLowerCase()}
		<button
			type="button"
			aria-label="Select color {color}"
			onclick={() => onSelect(color)}
			class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 {isSelected
				? 'scale-115 ring-2 ring-rose-400 ring-offset-2'
				: 'hover:scale-105'}"
			style="background-color: {color}; {color === '#FFFFFF' ? 'border: 1px solid rgba(0,0,0,0.15);' : ''}"
		>
			{#if isSelected}
				<svg
					class="h-4 w-4 {color === '#FFFFFF' || color === '#F59E0B' ? 'text-gray-900' : 'text-white'} drop-shadow-sm"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			{/if}
		</button>
	{/each}

	<!-- Custom Color Picker Trigger -->
	<label
		class="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-linear-to-tr from-rose-400 via-purple-400 to-sky-400 shadow-sm transition-transform hover:scale-105 active:scale-90"
	>
		<input
			bind:this={customInputRef}
			type="color"
			value={selectedColor}
			oninput={(e) => onSelect((e.target as HTMLInputElement).value)}
			class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
			aria-label="Pick custom color"
		/>
		<svg class="h-4 w-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
		</svg>
	</label>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
