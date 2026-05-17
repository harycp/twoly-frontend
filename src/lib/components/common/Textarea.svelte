<script lang="ts">
    import type { HTMLTextareaAttributes } from 'svelte/elements';

    interface Props extends HTMLTextareaAttributes {
        label?: string;
        error?: string;
        value?: string;
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
        <label for={id} class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">
            {label}
        </label>
    {/if}
    
    <div class="relative">
        <textarea
            {id}
            bind:value
            class="w-full rounded-[24px] border border-white/60 bg-white/40 backdrop-blur-xl p-5 text-base font-semibold text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-[#FDA4AF] focus:bg-white/70 focus:outline-none focus:ring-4 focus:ring-[#FDA4AF]/15 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.03)] disabled:opacity-50 resize-none {error ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50/50' : ''}"
            {...rest}
        ></textarea>
    </div>
    
    {#if error}
        <span class="text-[12px] font-bold text-red-500 ml-1 mt-0.5">{error}</span>
    {/if}
</div>