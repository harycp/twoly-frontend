<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    import { datePlanService } from '$lib/services/datePlan.service';
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    
    import logo from '$lib/assets/logos/twoly.webp';

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    let myName = $derived(authStore.user?.name || 'Me');
    let partnerName = $derived(coupleStore.partner?.name || 'Partner');

    let daysTogether = $derived.by(() => {
        if (!coupleStore.data?.created_at) return 0;
        const diffTime = new Date().getTime() - new Date(coupleStore.data.created_at).getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)));
    });

    let nextAnniversary = $derived.by(() => {
        if (!coupleStore.data?.anniversary_date) return null;
        const today = new Date();
        const annivDate = new Date(coupleStore.data.anniversary_date);
        let next = new Date(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
        if (next.getTime() < today.getTime()) next.setFullYear(today.getFullYear() + 1);
        return Math.ceil((next.getTime() - today.getTime()) / (1000 * 3600 * 24));
    });

    const memoriesQuery = createQuery(() => ({
        queryKey: ['memories'],
        queryFn: () => memoryService.getMemories()
    }));

    const datesQuery = createQuery(() => ({
        queryKey: ['date-plans', 'planned'],
        queryFn: () => datePlanService.getDatePlans('planned')
    }));

    let recentMemories = $derived(memoriesQuery.data?.slice(0, 4) || []);
    let upcomingDates = $derived(datesQuery.data?.slice(0, 2) || []);

    const formatDateClean = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };
</script>

<MobileShell>
    <header class="px-6 pt-10 pb-4 flex items-end justify-between">
        <div class="space-y-1">
            <div class="flex items-center gap-2 mb-3">
                <img src={logo} alt="Twoly Logo" class="h-6 w-6 object-contain drop-shadow-sm" />
                <span class="text-xs font-black uppercase tracking-[0.2em] text-[#FDA4AF]">Twoly</span>
            </div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
                Hi, {myName.split(' ')[0]} <span class="opacity-80">👋</span>
            </h1>
            <p class="text-sm font-medium text-gray-400 tracking-wide">Your digital emotional home</p>
        </div>
        <div class="flex -space-x-3 drop-shadow-sm pb-1">
            <div class="flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-[#FFF7ED] bg-gray-900 text-sm font-bold text-white shadow-md">
                {myName.charAt(0).toUpperCase()}
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-[#FFF7ED] bg-[#F8B4C8] text-sm font-bold text-white shadow-md">
                {partnerName.charAt(0).toUpperCase()}
            </div>
        </div>
    </header>

    <main class="px-6 pb-28 space-y-5">
        
        <div class="group relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#F8B4C8] to-[#FDA4AF] p-8 text-white shadow-[0_16px_40px_-12px_rgba(253,164,175,0.6)] transition-transform duration-500 ease-out hover:scale-[1.02] active:scale-95">
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
            </div>
        </div>

        <div class="grid grid-cols-2 gap-5">
            {#if nextAnniversary !== null}
            <div class="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50/50 transition-transform duration-300 ease-out active:scale-95 flex flex-col justify-between aspect-square">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#DDD6FE]/30 text-[#8B5CF6] text-xl shadow-inner">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <div>
                    <p class="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Anniversary</p>
                    <p class="text-2xl font-black text-gray-900 tracking-tight leading-none">{nextAnniversary} <span class="text-sm font-bold text-gray-400">days</span></p>
                </div>
            </div>
            {/if}

            <a href={resolve('/date-plans' as any)} class="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50/50 transition-transform duration-300 ease-out active:scale-95 flex flex-col justify-between aspect-square">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#FED7AA]/30 text-[#EA580C] text-xl shadow-inner">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                    <p class="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Up Next</p>
                    <p class="text-2xl font-black text-gray-900 tracking-tight leading-none">{upcomingDates.length} <span class="text-sm font-bold text-gray-400">plans</span></p>
                </div>
            </a>
        </div>

        <section class="pt-4 -mx-6">
            <div class="mb-5 flex items-end justify-between px-6">
                <div>
                    <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Camera Roll</h2>
                    <p class="text-sm font-medium text-gray-400 mt-0.5">Recent memories</p>
                </div>
                <a aria-label="See all memories" href={resolve('/memories' as any)} class="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-all active:scale-90">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </a>
            </div>

            {#if memoriesQuery.isPending}
                <div class="flex gap-4 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    <div class="animate-pulse shrink-0 w-64 aspect-[4/5] rounded-[32px] bg-white shadow-sm border border-gray-100"></div>
                    <div class="animate-pulse shrink-0 w-64 aspect-[4/5] rounded-[32px] bg-white shadow-sm border border-gray-100"></div>
                </div>
            {:else if recentMemories.length === 0}
                <div class="mx-6 flex flex-col items-center justify-center rounded-[32px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-gray-50 py-12 px-6 text-center">
                    <div class="h-16 w-16 mb-4 rounded-[24px] bg-gray-50 flex items-center justify-center text-gray-300">
                        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="text-base font-bold text-gray-800">No moments yet</p>
                    <p class="text-sm font-medium text-gray-400 mt-1">Start documenting your journey</p>
                </div>
            {:else}
                <div class="flex gap-4 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    {#each recentMemories as memory, i (memory.id)}
                        <a href={resolve(`/memories/${memory.id}` as any)} class="shrink-0 w-64 snap-center relative rounded-[32px] overflow-hidden aspect-[4/5] bg-gray-100 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:-translate-y-1 active:scale-95 group">
                            <div class="absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105
                                {i % 3 === 0 ? 'from-[#FED7AA] to-[#F8B4C8]' : i % 3 === 1 ? 'from-[#DDD6FE] to-[#FDA4AF]' : 'from-[#F8B4C8] to-[#FFF7ED]'}">
                            </div>
                            
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-80"></div>
                            
                            {#if memory.mood}
                                <div class="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-xl shadow-sm border border-white/20">
                                    {memory.mood === 'happy' ? '😊' : memory.mood === 'sad' ? '🥺' : '✨'}
                                </div>
                            {/if}

                            <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <p class="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">{formatDateClean(memory.memory_date)}</p>
                                <h3 class="text-2xl font-black tracking-tight leading-tight">{memory.title}</h3>
                            </div>
                        </a>
                    {/each}
                </div>
            {/if}
        </section>

    </main>
</MobileShell>

<style>
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>