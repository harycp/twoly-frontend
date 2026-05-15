<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// Mendefinisikan tipe data properties menggunakan interface
	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		isLoading?: boolean;
		children?: Snippet; // Snippet adalah pengganti <slot> di Svelte 5
	}

	// Menerima props menggunakan Svelte 5 Runes
	let {
		variant = 'primary',
		size = 'md',
		isLoading = false,
		children,
		class: className = '',
		disabled,
		...rest
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

	const variants = {
		primary: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500',
		secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
		danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
		ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
	};

	const sizes = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-11 px-4 text-base',
		lg: 'h-14 px-6 text-lg'
	};
</script>

<button
	class="{baseClasses} {variants[variant]} {sizes[size]} {className}"
	disabled={disabled || isLoading}
	{...rest}
>
	{#if isLoading}
		<svg
			class="mr-2 -ml-1 h-5 w-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
