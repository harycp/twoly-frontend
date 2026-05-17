<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { datePlanService } from '$lib/services/datePlan.service';
    import { calendarService } from '$lib/services/calendar.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Tabs from '$lib/components/common/Tabs.svelte';
    import DatePlanCard from '$lib/components/date-plans/DatePlanCard.svelte';
    import CoupleCalendar from '$lib/components/calendar/CoupleCalendar.svelte'; 

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    let currentTab = $state('planned'); 

    const plansQuery = createQuery(() => ({
        queryKey: ['date-plans', currentTab],
        queryFn: () => datePlanService.getDatePlans(currentTab),
        enabled: currentTab !== 'calendar'
    }));

    let plans = $derived(plansQuery.data || []);

    let selectedDate = $state(new Date());
    let currentMonthDate = $state(new Date());

    let startDateStr = $derived.by(() => {
        const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
        return d.toISOString().split('T')[0];
    });
    
    let endDateStr = $derived.by(() => {
        const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 2, 0);
        return d.toISOString().split('T')[0];
    });

    const calendarEventsQuery = createQuery(() => ({
        queryKey: ['calendar-events', startDateStr, endDateStr],
        queryFn: () => calendarService.getEvents(startDateStr, endDateStr),
        enabled: currentTab === 'calendar' 
    }));

    let calendarEvents = $derived(calendarEventsQuery.data || []);
    
    let selectedDayEvents = $derived.by(() => {
        return calendarEvents.filter(e => {
            const ed = new Date(e.event_date);
            return ed.getDate() === selectedDate.getDate() && 
                   ed.getMonth() === selectedDate.getMonth() && 
                   ed.getFullYear() === selectedDate.getFullYear();
        });
    });

    const formatEventTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };
</script>

<MobileShell>
    <!-- Header Diperbarui Untuk Mengakomodasi Kalender -->
    <PageHeader title="Plans & Calendar" subtitle="Design your next memories">
        {#snippet rightContent()}
            <a aria-label="Create new plan" href={resolve('/date-plans/new' as any)} class="group flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-300 active:scale-90 hover:bg-gray-800 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)]">
                <svg class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            </a>
        {/snippet}
    </PageHeader>

    <main class="px-6 pt-6 pb-32 space-y-8">
        
        <Tabs 
            items={[ 
                { value: 'planned', label: 'Upcoming' }, 
                { value: 'completed', label: 'Past Dates' },
                { value: 'calendar', label: 'Calendar' }
            ]} 
            activeValue={currentTab} 
            onChange={(val) => currentTab = val} 
        />

        {#if currentTab === 'calendar'}
            <section class="relative space-y-8 transition-opacity duration-300">
                <!-- Glow background -->
                <div class="absolute -right-5 top-10 h-32 w-32 rounded-full bg-[#FED7AA] opacity-20 blur-3xl pointer-events-none"></div>
                
                <CoupleCalendar 
                    events={calendarEvents}
                    bind:selectedDate
                    bind:currentMonthDate
                    onSelectDate={(d) => selectedDate = d}
                    onChangeMonth={(d) => currentMonthDate = d}
                />

                <!-- DAFTAR EVENT DI TANGGAL YANG DIPILIH -->
                <div>
                    <div class="mb-4">
                        <h3 class="text-lg font-black text-gray-900 tracking-tight">
                            {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                    </div>

                    {#if calendarEventsQuery.isPending}
                        <div class="animate-pulse h-24 w-full rounded-[24px] bg-white/50 border border-gray-100"></div>
                    {:else if selectedDayEvents.length === 0}
                        <div class="rounded-[32px] border border-dashed border-gray-200 py-10 text-center">
                            <p class="text-[13px] font-bold text-gray-400">No moments planned for today.</p>
                        </div>
                    {:else}
                        <div class="space-y-4">
                            {#each selectedDayEvents as ev (ev.id)}
                                <a 
                                    href={ev.event_type === 'memory' ? `/memories/${ev.reference_id}` : ev.event_type === 'date_plan' ? `/date-plans/${ev.reference_id}` : '#'}
                                    class="block relative overflow-hidden rounded-[28px] bg-white/60 backdrop-blur-xl p-5 shadow-sm border border-white transition-transform active:scale-95
                                        {ev.event_type === 'memory' ? 'hover:bg-[#F8B4C8]/10' : ev.event_type === 'date_plan' ? 'hover:bg-[#FED7AA]/10' : 'hover:bg-gray-50'}"
                                >
                                    <div class="flex gap-4">
                                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] shadow-inner
                                            {ev.event_type === 'memory' ? 'bg-[#FDA4AF]/20 text-[#FDA4AF]' : 
                                             ev.event_type === 'date_plan' ? 'bg-[#FED7AA]/30 text-[#EA580C]' : 
                                             'bg-[#DDD6FE]/30 text-[#8B5CF6]'}">
                                            {#if ev.event_type === 'memory'}
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            {:else if ev.event_type === 'date_plan'}
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            {:else}
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                                            {/if}
                                        </div>

                                        <div class="flex-1 overflow-hidden pt-0.5">
                                            <h4 class="truncate text-base font-black text-gray-900 tracking-tight">{ev.title}</h4>
                                            
                                            <div class="flex items-center gap-3 mt-1 text-[12px] font-bold text-gray-400">
                                                <span class="uppercase tracking-wider">{formatEventTime(ev.event_date.toString())}</span>
                                                {#if ev.location_name}
                                                    <span class="flex items-center gap-1 truncate">
                                                        <svg class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                        <span class="truncate">{ev.location_name}</span>
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            </section>
        
        {:else}
            <!-- ==== VIEW: LIST DATE PLANS (UPCOMING / PAST) ==== -->
            <section class="transition-opacity duration-300">
                {#if plansQuery.isPending}
                    <div class="space-y-4">
                        <div class="animate-pulse h-28 w-full rounded-[32px] bg-white/50 border border-gray-100 shadow-sm"></div>
                        <div class="animate-pulse h-28 w-full rounded-[32px] bg-white/50 border border-gray-100 shadow-sm"></div>
                    </div>
                {:else if plans.length === 0}
                    <div class="flex flex-col items-center justify-center mt-8 py-16 px-6 text-center opacity-80">
                        <div class="h-20 w-20 mb-5 rounded-[24px] bg-[#FED7AA]/30 border border-white flex items-center justify-center text-[#EA580C] shadow-inner rotate-3">
                            <svg class="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <h2 class="text-xl font-black text-gray-900 tracking-tight mb-2">No {currentTab === 'planned' ? 'upcoming' : 'past'} dates</h2>
                        <p class="text-[13.5px] font-medium text-gray-500 leading-relaxed max-w-[220px]">
                            {currentTab === 'planned' ? "Plan something special with your partner today!" : "You haven't completed any date plans yet."}
                        </p>
                    </div>
                {:else}
                    <div class="space-y-4">
                        {#each plans as plan (plan.id)}
                            <DatePlanCard {plan} />
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}

    </main>
</MobileShell>