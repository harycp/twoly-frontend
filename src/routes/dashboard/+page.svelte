<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    import { SvelteDate } from 'svelte/reactivity';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    import { datePlanService } from '$lib/services/datePlan.service';
    import { loveNoteService } from '$lib/services/loveNote.service'; 
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import MemoryCover from '$lib/components/memories/MemoryCover.svelte'; 
    import logo from '$lib/assets/logos/twoly.webp';
    
    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    let myId = $derived(authStore.user?.id);
    let myName = $derived(authStore.user?.name || 'Me');
    let partnerName = $derived(coupleStore.partner?.name || 'Partner');
    
    let myAvatar = $derived(authStore.user?.avatar_url);
    let partnerAvatar = $derived(coupleStore.partner?.avatar_url);

    let daysTogether = $derived.by(() => {
        const startDateStr = coupleStore.data?.anniversary_date || coupleStore.data?.created_at;
        if (!startDateStr) return 0;
        
        const startDate = new SvelteDate(startDateStr);
        startDate.setHours(0, 0, 0, 0); 
        
        const today = new SvelteDate();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - startDate.getTime();
        return Math.max(0, Math.floor(diffTime / (1000 * 3600 * 24)));
    });

    let nextAnniversary = $derived.by(() => {
        if (!coupleStore.data?.anniversary_date) return null;
        
        const today = new SvelteDate();
        today.setHours(0, 0, 0, 0);
        
        const annivDate = new SvelteDate(coupleStore.data.anniversary_date);
        let next = new SvelteDate(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
        
        if (next.getTime() < today.getTime()) {
            next.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = next.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 3600 * 24));
    });

    const memoriesQuery = createQuery(() => ({
        queryKey: ['memories'],
        queryFn: () => memoryService.getMemories()
    }));

    const datesQuery = createQuery(() => ({
        queryKey: ['date-plans', 'planned'],
        queryFn: () => datePlanService.getDatePlans('planned')
    }));

    const notesQuery = createQuery(() => ({
        queryKey: ['love-notes'],
        queryFn: () => loveNoteService.getLoveNotes()
    }));

    let recentMemories = $derived(memoriesQuery.data?.slice(0, 4) || []);
    let upcomingDates = $derived(datesQuery.data || []);
    
    let closestPlan = $derived(upcomingDates.length > 0 ? upcomingDates[0] : null);
    
    let closestPlanDaysLeft = $derived.by(() => {
        if (!closestPlan) return null;
        const planDate = new SvelteDate(closestPlan.plan_date);
        planDate.setHours(0, 0, 0, 0);
        const today = new SvelteDate();
        today.setHours(0, 0, 0, 0);
        const diff = planDate.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    });

    let lockedNotesCount = $derived.by(() => {
        const notes = notesQuery.data || [];
        return notes.filter(n => !n.is_opened && n.receiver_id === myId).length;
    });

    const formatDateClean = (dateString: string) => {
        return new SvelteDate(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
</script>

<MobileShell>
    <PageHeader title={`Hi, ${myName.split(' ')[0]} 👋`} subtitle="Your digital emotional home">
        {#snippet leftContent()}
            <div class="flex items-center gap-2">
                <img src={logo} alt="Twoly Logo" class="h-6 w-6 object-contain drop-shadow-sm" />
                <span class="text-xs font-black uppercase tracking-[0.2em] text-[#FDA4AF]">Twoly</span>
            </div>
        {/snippet}
        {#snippet rightContent()}
            <div class="flex -space-x-3 drop-shadow-sm pb-1">
                <div class="relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-4 ring-[#FFF7ED] bg-gray-900 text-sm font-bold text-white shadow-md">
                    {#if myAvatar}
                        <img src={myAvatar} alt={myName} class="h-full w-full object-cover" />
                    {:else}
                        {myName.charAt(0).toUpperCase()}
                    {/if}
                </div>
                <div class="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-4 ring-[#FFF7ED] bg-[#F8B4C8] text-sm font-bold text-white shadow-md">
                    {#if partnerAvatar}
                        <img src={partnerAvatar} alt={partnerName} class="h-full w-full object-cover" />
                    {:else}
                        {partnerName.charAt(0).toUpperCase()}
                    {/if}
                </div>
            </div>
        {/snippet}
    </PageHeader>

    <main class="px-6 pb-28 space-y-6">
        
        <div class="group relative overflow-hidden rounded-[36px] bg-linear-to-br from-[#F8B4C8] to-[#FDA4AF] p-8 text-white shadow-[0_16px_40px_-12px_rgba(253,164,175,0.6)] transition-transform duration-500 ease-out hover:scale-[1.02] active:scale-95">
            <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white opacity-20 blur-3xl"></div>
            <div class="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#DDD6FE] opacity-20 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col justify-center items-center text-center">
                <div class="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 px-4 py-2 mb-4 shadow-sm">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/95">Love Streak</span>
                </div>
                
                <div class="flex items-baseline gap-2">
                    <span class="text-7xl font-black tracking-tighter drop-shadow-sm">{daysTogether}</span>
                </div>
                <p class="text-base font-semibold text-white/90 tracking-wide mt-1">Days together</p>
                
                {#if coupleStore.data?.anniversary_date}
                    <p class="text-[11px] font-bold text-white/70 uppercase tracking-widest mt-4 bg-black/10 px-3 py-1 rounded-full">
                        Since {formatDateClean(coupleStore.data.anniversary_date)}
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-3">
            <a href={resolve('/memories/new')} class="flex-1 flex flex-col items-center justify-center py-4 rounded-[28px] bg-white/60 backdrop-blur-xl shadow-sm border border-white active:scale-95 transition-all hover:bg-white/80 group">
                <div class="h-12 w-12 rounded-full bg-[#FDA4AF]/15 text-[#FDA4AF] flex items-center justify-center mb-2 transition-transform group-hover:-translate-y-1">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span class="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Memory</span>
            </a>
            
            <a href={resolve('/date-plans/new')} class="flex-1 flex flex-col items-center justify-center py-4 rounded-[28px] bg-white/60 backdrop-blur-xl shadow-sm border border-white active:scale-95 transition-all hover:bg-white/80 group">
                <div class="h-12 w-12 rounded-full bg-[#FED7AA]/30 text-[#EA580C] flex items-center justify-center mb-2 transition-transform group-hover:-translate-y-1">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <span class="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Plan Date</span>
            </a>

            <a href={resolve('/love-notes/new')} class="flex-1 flex flex-col items-center justify-center py-4 rounded-[28px] bg-white/60 backdrop-blur-xl shadow-sm border border-white active:scale-95 transition-all hover:bg-white/80 group">
                <div class="h-12 w-12 rounded-full bg-[#DDD6FE]/40 text-[#8B5CF6] flex items-center justify-center mb-2 transition-transform group-hover:-translate-y-1">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5"/></svg>
                </div>
                <span class="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Send Note</span>
            </a>
        </div>

        <div class="grid grid-cols-2 gap-4">
            {#if nextAnniversary !== null}
            <div class="relative overflow-hidden rounded-4xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50/50 flex flex-col justify-between aspect-square">
                <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDD6FE]/30 text-[#8B5CF6] text-xl shadow-inner">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <div>
                    <p class="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Next Anniv.</p>
                    <p class="text-2xl font-black text-gray-900 tracking-tight leading-none">{nextAnniversary} <span class="text-xs font-bold text-gray-400">days left</span></p>
                </div>
            </div>
            {/if}

            <a href={resolve(closestPlan ? `/date-plans/${closestPlan.id}` : '/date-plans')} class="relative overflow-hidden rounded-4xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50/50 transition-transform duration-300 ease-out active:scale-95 flex flex-col justify-between aspect-square group">
                <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FED7AA]/30 text-[#EA580C] text-xl shadow-inner transition-transform group-hover:scale-110">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                    <p class="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Up Next</p>
                    {#if closestPlan}
                        <p class="text-[15px] font-black text-gray-900 tracking-tight leading-tight truncate">{closestPlan.title}</p>
                        <p class="text-[11px] font-bold text-[#EA580C] mt-0.5">
                            {closestPlanDaysLeft === 0 ? 'Today!' : `in ${closestPlanDaysLeft} days`}
                        </p>
                    {:else}
                        <p class="text-[14px] font-black text-gray-400 tracking-tight leading-tight">No plans yet</p>
                        <p class="text-[11px] font-bold text-[#EA580C] mt-0.5">Tap to plan a date</p>
                    {/if}
                </div>
            </a>
        </div>

        <a href={resolve('/love-notes')} class="group relative flex items-center justify-between overflow-hidden rounded-4xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50/50 transition-transform duration-300 ease-out active:scale-95">
            <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F8B4C8]/20 text-[#FDA4AF] shadow-inner relative transition-transform group-hover:rotate-12">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5"/></svg>
                    {#if lockedNotesCount > 0}
                        <div class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-[1.5px] border-white">{lockedNotesCount}</div>
                    {/if}
                </div>
                <div>
                    <h3 class="text-[17px] font-black text-gray-900 tracking-tight">Love Notes</h3>
                    <p class="text-[12px] font-bold text-gray-400 mt-0.5">
                        {#if lockedNotesCount > 0}
                            You have <span class="text-[#FDA4AF]">{lockedNotesCount} locked note{lockedNotesCount > 1 ? 's' : ''}</span> 💌
                        {:else}
                            Send a secret message
                        {/if}
                    </p>
                </div>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#FDA4AF]/10 group-hover:text-[#FDA4AF] transition-colors">
                <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </div>
        </a>

        <section class="pt-4 -mx-6">
            <div class="mb-4 flex items-end justify-between px-6">
                <div>
                    <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Camera Roll</h2>
                    <p class="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Recent memories</p>
                </div>
                <a aria-label="See all memories" href={resolve('/memories')} class="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-all active:scale-90">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </a>
            </div>

            {#if memoriesQuery.isPending}
                <div class="flex gap-4 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    <div class="animate-pulse shrink-0 w-60 aspect-4/5 rounded-4xl bg-white/60 shadow-sm border border-gray-100"></div>
                    <div class="animate-pulse shrink-0 w-60 aspect-4/5 rounded-4xl bg-white/60 shadow-sm border border-gray-100"></div>
                </div>
            {:else if recentMemories.length === 0}
                <div class="mx-6 flex flex-col items-center justify-center rounded-[36px] bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.03)] border border-white py-12 px-6 text-center">
                    <div class="h-16 w-16 mb-4 rounded-[20px] bg-gray-50 flex items-center justify-center text-gray-300">
                        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="text-[15px] font-black text-gray-800 tracking-tight">No moments yet</p>
                    <p class="text-[12px] font-bold text-gray-400 mt-1">Start documenting your journey</p>
                </div>
            {:else}
                <div class="flex gap-4 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    {#each recentMemories as memory, i (memory.id)}
                        <a href={resolve(`/memories/${memory.id}`)} class="shrink-0 w-60 snap-center relative rounded-4xl overflow-hidden aspect-4/5 bg-gray-100 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:-translate-y-1 active:scale-95 group">
                            
                            <MemoryCover memoryId={memory.id} fallbackIndex={i} />

                            <div class="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100 z-20 pointer-events-none"></div>

                            <div class="absolute inset-0 p-5 flex flex-col justify-between z-30 pointer-events-none">
                                <div class="flex justify-between items-start">
                                    <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 shadow-sm">
                                        <span class="text-[10px] font-black uppercase tracking-[0.15em] text-white">
                                            {formatDateClean(memory.memory_date.toString())}
                                        </span>
                                    </div>
                                    {#if memory.mood}
                                        <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-2.5 py-1 shadow-sm">
                                            <span class="text-[9px] font-black uppercase tracking-widest text-white">{memory.mood}</span>
                                        </div>
                                    {/if}
                                </div>

                                <div class="transform transition-transform duration-500 ease-out group-hover:-translate-y-1">
                                    <h3 class="text-2xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-sm line-clamp-2">{memory.title}</h3>
                                    {#if memory.location_name}
                                        <p class="flex items-center gap-1.5 text-[12px] font-bold text-white/80 mb-2 truncate">
                                            <svg class="h-3.5 w-3.5 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            <span class="truncate">{memory.location_name}</span>
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>
            {/if}
        </section>

    </main>
</MobileShell>

<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>