<script lang="ts">
    interface Props {
        mood: string;
        class?: string;
    }

    let { mood, class: className = '' }: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5 rounded-full bg-[#F8B4C8]/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#FDA4AF] {className}">
    {mood}
</span>