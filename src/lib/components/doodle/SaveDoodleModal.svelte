<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Props {
		isOpen: boolean;
		previewUrl: string;
		isSaving: boolean;
		onSave: (title: string) => void;
		onClose: () => void;
	}

	let { isOpen, previewUrl, isSaving, onSave, onClose }: Props = $props();

	let title = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSave(title);
	}
</script>

{#if isOpen}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
	>
		<div
			in:scale={{ duration: 250, start: 0.9 }}
			class="relative w-full max-w-sm overflow-hidden rounded-[36px] border border-white/80 bg-white p-6 shadow-2xl"
		>
			<!-- Close Button -->
			<button
				type="button"
				aria-label="Close"
				onclick={onClose}
				disabled={isSaving}
				class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 active:scale-90"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-500 shadow-inner"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				</div>
				<h3 class="text-xl font-black text-gray-900 tracking-tight">Save Our Doodle</h3>
				<p class="text-xs font-bold text-gray-400 mt-0.5">Keep this cute memory forever</p>
			</div>

			<!-- Canvas Preview Thumbnail -->
			{#if previewUrl}
				<div
					class="my-4 aspect-4/3 w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#FFF7ED] shadow-inner"
				>
					<img src={previewUrl} alt="Doodle Preview" class="h-full w-full object-contain" />
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="doodle-title" class="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
						Title / Note (Optional)
					</label>
					<input
						id="doodle-title"
						type="text"
						bind:value={title}
						placeholder="e.g., Late night sketch"
						maxlength="80"
						disabled={isSaving}
						class="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-rose-100"
					/>
				</div>

				<div class="flex gap-2.5 pt-1">
					<button
						type="button"
						onclick={onClose}
						disabled={isSaving}
						class="flex-1 rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={isSaving}
						class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 py-3 text-xs font-black text-white shadow-lg shadow-rose-200 transition-all hover:from-rose-600 hover:to-pink-600 active:scale-95 disabled:opacity-50"
					>
						{#if isSaving}
							<svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span>Saving...</span>
						{:else}
							<span>Save to Gallery</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
