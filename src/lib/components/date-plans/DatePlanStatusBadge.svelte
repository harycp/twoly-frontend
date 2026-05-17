<script lang="ts">
    interface Props {
        status: string;
        class?: string;
    }

    let { status, class: className = '' }: Props = $props();

    const statusStyles: Record<string, string> = {
        planned: 'bg-[#FED7AA]/30 text-[#EA580C] border-[#FED7AA]/50',
        ongoing: 'bg-[#DDD6FE]/30 text-[#8B5CF6] border-[#DDD6FE]/50',
        completed: 'bg-green-100/60 text-green-700 border-green-200/60',
        cancelled: 'bg-gray-100/60 text-gray-500 border-gray-200/60'
    };
</script>

<span class="inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] {statusStyles[status] || statusStyles.planned} {className}">
    {status}
</span>