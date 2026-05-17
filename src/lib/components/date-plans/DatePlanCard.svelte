<script lang="ts">
    import { resolve } from '$app/paths';
    import type { DatePlan } from '$lib/types/models.types';

    interface Props {
        plan: DatePlan;
    }

    let { plan }: Props = $props();

    const date = new Date(plan.plan_date);
    const monthStr = date.toLocaleDateString('en-GB', { month: 'short' });
    const dateNum = date.getDate();

    const statusColors: Record<string, string> = {
        planned: 'bg-[#FED7AA]/30 text-[#EA580C] border-[#FED7AA]/50',
        ongoing: 'bg-[#DDD6FE]/30 text-[#8B5CF6] border-[#DDD6FE]/50',
        completed: 'bg-green-100/50 text-green-700 border-green-200/50',
        cancelled: 'bg-gray-100/50 text-gray-500 border-gray-200/50'
    };
</script>

<a href={resolve(`/date-plans/${plan.id}` as any)} class="flex items-center gap-5 rounded-[32px] bg-white/40 backdrop-blur-xl p-4 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.03)] border border-white/60 transition-all duration-300 ease-out active:scale-95 group hover:bg-white/60">
    <!-- Calendar Box -->
    <div class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[20px] bg-white/60 text-gray-800 shadow-sm border border-white transition-colors duration-300 group-hover:bg-[#FED7AA]/20 group-hover:text-[#EA580C]">
        <span class="text-[10px] font-extrabold uppercase tracking-widest opacity-50">{monthStr}</span>
        <span class="text-2xl font-black leading-none mt-0.5">{dateNum}</span>
    </div>
    
    <!-- Info -->
    <div class="flex-1 overflow-hidden">
        <h3 class="truncate text-lg font-black text-gray-900 tracking-tight">{plan.title}</h3>
        
        {#if plan.location_name}
            <p class="truncate text-[13px] font-bold text-gray-400 mt-0.5 flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {plan.location_name}
            </p>
        {/if}
        
        <div class="mt-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider {statusColors[plan.status] || statusColors.planned}">
            {plan.status}
        </div>
    </div>
</a>