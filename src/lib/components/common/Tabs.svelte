<script lang="ts">
    interface Tab {
        value: string;
        label: string;
    }

    interface Props {
        items: Tab[];
        activeValue: string;
        onChange: (value: string) => void;
    }

    let { items, activeValue, onChange }: Props = $props();
</script>

<div class="flex p-1.5 bg-white/40 backdrop-blur-xl rounded-full border border-white/60 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]">
    {#each items as item (item.value)}
        <button
            type="button"
            onclick={() => onChange(item.value)}
            class="flex-1 rounded-full py-3 text-[12px] font-black uppercase tracking-widest transition-all duration-300 {activeValue === item.value ? 'bg-white shadow-sm border border-white text-[#FDA4AF]' : 'text-gray-400 hover:text-gray-600'}"
        >
            {item.label}
        </button>
    {/each}
</div>