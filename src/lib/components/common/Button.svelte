<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { HTMLButtonAttributes } from 'svelte/elements';

    interface Props extends HTMLButtonAttributes {
        variant?: 'primary' | 'secondary' | 'ghost';
        size?: 'md' | 'lg';
        isLoading?: boolean;
        children?: Snippet;
    }

    let {
        variant = 'primary',
        size = 'lg',
        isLoading = false,
        children,
        class: className = '',
        disabled,
        ...rest
    }: Props = $props();

    const baseClasses = "relative inline-flex items-center justify-center font-bold transition-all duration-300 ease-out active:scale-95 disabled:opacity-60 disabled:active:scale-100 overflow-hidden";

    const variants = {
        primary: "bg-gradient-to-r from-[#FDA4AF] to-[#F8B4C8] text-white shadow-[0_8px_20px_-6px_rgba(253,164,175,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(253,164,175,0.6)]",
        secondary: "bg-white text-gray-800 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_20px_-5px_rgba(0,0,0,0.08)]",
        ghost: "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
    };

    const sizes = {
        md: "h-12 px-6 text-sm rounded-full",
        lg: "h-14 px-8 text-base rounded-full"
    };
</script>

<button
    class="{baseClasses} {variants[variant]} {sizes[size]} {className}"
    disabled={disabled || isLoading}
    {...rest}
>
    {#if isLoading}
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 opacity-80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    {/if}
    {#if children}
        <span class="relative z-10 flex items-center gap-2">
            {@render children()}
        </span>
    {/if}
</button>