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
        value = $bindable(''), 
        class: className = '',
        id = crypto.randomUUID(),
        ...rest
    }: Props = $props();
</script>

<div class="flex flex-col gap-2 w-full {className}">
    {#if label}
        <label for={id} class="text-sm font-extrabold text-gray-700 tracking-tight ml-1">
            {label}
        </label>
    {/if}
    
    <div class="relative">
        <input
            {id}
            bind:value
            class="h-14 w-full rounded-2xl border border-gray-100 bg-white/80 px-5 text-base font-medium text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-[#FDA4AF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FDA4AF]/15 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] disabled:opacity-50 {error ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50/50' : ''}"
            {...rest}
        />
    </div>
    
    {#if error}
        <span class="text-[13px] font-semibold text-red-500 ml-1 mt-0.5">{error}</span>
    {/if}
</div>