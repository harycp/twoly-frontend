<script lang="ts">
    import { fade, scale } from 'svelte/transition';

    interface Props {
        count: number;
    }

    let { count }: Props = $props();
</script>

<div class="absolute top-20 flex flex-col items-center justify-center w-full z-50 pointer-events-none min-h-[60px]">
    {#if count > 1}
        <div in:scale={{ duration: 200, start: 0.5 }} out:fade={{ duration: 300 }} class="flex items-baseline gap-1.5 drop-shadow-[0_0_20px_rgba(2fb,113,133,0.6)]">
            <span class="text-5xl font-black text-white italic">{count}</span>
            <span class="text-xl font-bold text-rose-400 italic">Combo!</span>
        </div>
    {/if}
</div>