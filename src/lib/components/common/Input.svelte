<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		value?: string | number;
	}

	let {
		label,
		error,
		// $bindable() memungkinkan value ini di-bind (two-way binding) dari parent
		value = $bindable(''),
		class: className = '',
		id = crypto.randomUUID(),
		...rest
	}: Props = $props();
</script>

<div class="flex w-full flex-col gap-1.5 {className}">
	{#if label}
		<label for={id} class="text-sm font-medium text-gray-700">
			{label}
		</label>
	{/if}

	<input
		{id}
		bind:value
		class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 transition-colors focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 {error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500'
			: ''}"
		{...rest}
	/>

	{#if error}
		<span class="text-xs text-red-500">{error}</span>
	{/if}
</div>
