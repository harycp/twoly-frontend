<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    import { SvelteDate } from 'svelte/reactivity';
    import { fly } from 'svelte/transition';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    import { datePlanService } from '$lib/services/datePlan.service';
    import { loveNoteService } from '$lib/services/loveNote.service'; 
    import { supabase } from '$lib/services/supabase.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import MemoryCover from '$lib/components/memories/MemoryCover.svelte'; 
    import TouchStreakRibbon from '$lib/components/dashboard/TouchStreakRibbon.svelte';
    import logo from '$lib/assets/logos/twoly.webp';
    import HeartIcon from '$lib/components/icons/HeartIcon.svelte';
    
    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    let myId = $derived(authStore.user?.id);
    let myName = $derived(authStore.user?.name || 'Me');
    let partnerName = $derived(coupleStore.partner?.name || 'Partner');
    
    let myAvatar = $derived(authStore.user?.avatar_url);
    let partnerAvatar = $derived(coupleStore.partner?.avatar_url);

    const PARTNER_ONLINE_GRACE_MS = 5 * 60 * 1000;

    function isRecentlyOnline(dateString: string | null | undefined): boolean {
        if (!dateString) return false;

        const lastSeenAt = new Date(dateString).getTime();

        if (Number.isNaN(lastSeenAt)) return false;

        return Date.now() - lastSeenAt <= PARTNER_ONLINE_GRACE_MS;
    }

    // Presence Derived States
    let isPartnerOnline = $derived.by(() => {
        if (coupleStore.isPartnerPresenceSynced) {
            return coupleStore.isPartnerOnline;
        }

        if (coupleStore.isPartnerOnline) return true;
        return isRecentlyOnline(coupleStore.partnerLastSeen);
    });

    let partnerLastSeen = $derived(coupleStore.partnerLastSeen);

    // Pop-up Logic
    let activePopup = $state<'me' | 'partner' | null>(null);
    let popupTimeout: ReturnType<typeof setTimeout> | null = null;

    function showPopup(type: 'me' | 'partner') {
        activePopup = type;
        if (popupTimeout) clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => { activePopup = null; }, 4000);
    }

    function formatPartnerStatus() {
        if (isPartnerOnline) return 'Online';
        if (partnerLastSeen) return `Last seen ${formatRelativeTime(partnerLastSeen)}`;
        return 'Offline';
    }

    const formatRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

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

    interface TouchEntry {
        created_at: string;
        sender_id: string;
    }

    const touchStreakQuery = createQuery(() => ({
        queryKey: ['touch-streak', coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id],
        enabled: !!(coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id),
        queryFn: async () => {
            const coupleId = coupleStore.data?.id || (coupleStore.data as { couple_id?: string } | null)?.couple_id;

            if (!coupleId) return [] as TouchEntry[];

            const { data, error } = await supabase
                .from('couple_touches')
                .select('created_at, sender_id')
                .eq('couple_id', coupleId)
                .order('created_at', { ascending: false })
                .limit(180);

            if (error) {
                throw error;
            }

            return (data ?? []) as TouchEntry[];
        }
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

    function toDateKey(value: string | Date) {
        const date = value instanceof Date ? value : new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    let touchStreak = $derived.by(() => {
            const touches = touchStreakQuery.data || [];

            if (touches.length === 0) return 0;

            const meId = myId;
            const partnerId = coupleStore.partner?.id;
            if (!meId || !partnerId) return 0;

            // build map dateKey => map of sender ids on that day (plain object to avoid Svelte Map/Set warnings)
            const daySenders: Record<string, Record<string, true>> = {};
            for (const t of touches) {
                const key = toDateKey(t.created_at);
                if (!daySenders[key]) daySenders[key] = {};
                daySenders[key][String(t.sender_id)] = true;
            }

            const today = new SvelteDate();
            today.setHours(0, 0, 0, 0);

            let streak = 0;
            const cursor = new SvelteDate(today);

            while (true) {
                const key = toDateKey(cursor);
                const senders = daySenders[key];
                if (!senders) break;
                if (!(senders[String(meId)] && senders[String(partnerId)])) break;
                streak += 1;
                cursor.setDate(cursor.getDate() - 1);
            }

            return streak;
    });

    const formatDateClean = (dateString: string) => {
        return new SvelteDate(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

</script>

<MobileShell>
    <!-- GREETING HEADER PREMIUM -->
    <PageHeader title={`Hi, ${myName.split(' ')[0]} 👋`} subtitle="Your digital emotional home">
        {#snippet leftContent()}
            <div class="flex items-center gap-2">
                <img src={logo} alt="Twoly Logo" class="h-6 w-6 object-contain drop-shadow-sm" />
                <span class="text-xs font-black uppercase tracking-[0.2em] text-[#FDA4AF]">Twoly</span>
            </div>
        {/snippet}
        {#snippet rightContent()}
            <div class="relative flex -space-x-4 drop-shadow-sm pb-1 hover:space-x-1 transition-all duration-300">
                <button aria-label="Check my status" onclick={() => showPopup('me')} class="relative z-20 flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#FFF7ED] bg-gray-900 text-base font-black text-white shadow-lg transition-transform hover:scale-110 hover:z-30 cursor-pointer p-0 focus:outline-none focus:ring-2 focus:ring-[#FDA4AF]/50">
                    {#if myAvatar}
                        <img src={myAvatar} alt={myName} class="h-full w-full object-cover" />
                    {:else}
                        {myName.charAt(0).toUpperCase()}
                    {/if}
                </button>
                <button aria-label="Check partner status" onclick={() => showPopup('partner')} class="relative z-10 flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#FFF7ED] bg-linear-to-br from-[#F8B4C8] to-[#FDA4AF] text-base font-black text-white shadow-lg transition-transform hover:scale-110 hover:z-30 cursor-pointer p-0 focus:outline-none focus:ring-2 focus:ring-[#FDA4AF]/50">
                    {#if partnerAvatar}
                        <img src={partnerAvatar} alt={partnerName} class="h-full w-full object-cover" />
                    {:else}
                        {partnerName.charAt(0).toUpperCase()}
                    {/if}
                    <!-- Tiny green dot indicator if partner is currently online -->
                    {#if isPartnerOnline}
                        <div class="absolute bottom-0 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-[#FFF7ED]"></div>
                    {/if}
                </button>

                <!-- STATUS POPUP -->
                {#if activePopup}
                    <div transition:fly={{y: -10, duration: 250}} class="absolute -bottom-11 right-0 bg-gray-900/95 backdrop-blur-md text-white text-[11px] px-3.5 py-2 rounded-full whitespace-nowrap shadow-xl z-50 flex items-center gap-2 font-bold tracking-wide border border-white/10 pointer-events-none">
                        {#if activePopup === 'me'}
                            <span class="relative flex h-3 w-3">
                                <HeartIcon className="animate-ping absolute inset-0 h-full w-full text-green-400 opacity-60" />
                                <HeartIcon className="relative h-3 w-3 text-green-500" />
                            </span>
                            Online
                        {:else if activePopup === 'partner'}
                            {#if isPartnerOnline}
                                <span class="relative flex h-3 w-3">
                                    <HeartIcon className="animate-ping absolute inset-0 h-full w-full text-green-400 opacity-60" />
                                    <HeartIcon className="relative h-3 w-3 text-green-500" />
                                </span>
                                Online
                            {:else}
                                <span class="h-2 w-2 rounded-full bg-gray-400"></span>
                                {formatPartnerStatus()}
                            {/if}
                        {/if}
                    </div>
                {/if}
            </div>
        {/snippet}
    </PageHeader>

    <main class="px-6 pb-28 space-y-7">
        
        <!-- WIDGET 1: Hero Love Streak (Masterpiece Card) -->
        <div class="group relative overflow-hidden rounded-[40px] bg-linear-to-br from-[#F8B4C8] via-[#FDA4AF] to-[#fb7185] p-8 text-white shadow-[0_20px_50px_-12px_rgba(253,164,175,0.7)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-95 border border-white/20">
            <!-- Dekorasi Kaca & Cahaya -->
            <div class="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-20 blur-3xl pointer-events-none"></div>
            <div class="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#DDD6FE] opacity-30 blur-3xl pointer-events-none"></div>
            
            <div class="relative z-10 flex flex-col justify-center items-center text-center">
                <!-- Badge Dinamis -->
                    <div class="inline-flex items-center gap-2.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 px-4 py-2 mb-4 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]">
                    <span class="relative flex h-3 w-3">
                        <HeartIcon className="animate-ping absolute inset-0 h-full w-full text-white opacity-40" />
                        <HeartIcon className="relative h-3 w-3 text-white" />
                    </span>
                    <span class="text-[11px] font-black uppercase tracking-[0.2em] text-white/95 mt-0.5">Love Streak</span>
                </div>
                
                <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-[80px] font-black tracking-tighter drop-shadow-md leading-none">{daysTogether}</span>
                </div>
                <p class="text-[17px] font-bold text-white/90 tracking-wide">Days together</p>
                
                {#if coupleStore.data?.anniversary_date}
                    <div class="mt-5 rounded-2xl bg-black/10 backdrop-blur-md px-4 py-2 border border-white/10">
                        <p class="text-[11px] font-black text-white/80 uppercase tracking-widest">
                            Since {formatDateClean(coupleStore.data.anniversary_date)}
                        </p>
                    </div>
                {/if}
            </div>
        </div>

        <!-- QUICK ACTIONS: UX Diperbaiki (Memory, Plan Date, Gallery) -->
        <div class="flex items-center justify-between gap-3">
            <a href={resolve('/memories/new')} class="flex-1 flex flex-col items-center justify-center py-5 rounded-4xl bg-white/60 backdrop-blur-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.04)] border border-white active:scale-95 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_25px_-8px_rgba(0,0,0,0.08)] group">
                <div class="h-14 w-14 rounded-[20px] bg-[#FDA4AF]/15 text-[#FDA4AF] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:bg-[#FDA4AF] group-hover:text-white group-hover:shadow-md">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span class="text-[11px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Memory</span>
            </a>
            
            <a href={resolve('/date-plans/new')} class="flex-1 flex flex-col items-center justify-center py-5 rounded-4xl bg-white/60 backdrop-blur-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.04)] border border-white active:scale-95 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_25px_-8px_rgba(0,0,0,0.08)] group">
                <div class="h-14 w-14 rounded-[20px] bg-[#FED7AA]/30 text-[#EA580C] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:bg-[#EA580C] group-hover:text-white group-hover:shadow-md">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <span class="text-[11px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Plan Date</span>
            </a>

            <!-- MENGGANTI 'SEND NOTE' MENJADI 'GALLERY' -->
            <a href={resolve('/gallery')} class="flex-1 flex flex-col items-center justify-center py-5 rounded-4xl bg-white/60 backdrop-blur-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.04)] border border-white active:scale-95 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_25px_-8px_rgba(0,0,0,0.08)] group">
                <div class="h-14 w-14 rounded-[20px] bg-[#DDD6FE]/40 text-[#8B5CF6] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:bg-[#8B5CF6] group-hover:text-white group-hover:shadow-md">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <span class="text-[11px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Gallery</span>
            </a>
        </div>

        <!-- TOUCH RHYTHM SECTION -->
        <section class="pt-1">
            <div class="mb-4 flex items-end justify-between px-1">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 tracking-tight">Touch rhythm</h2>
                    <p class="text-[12px] font-black text-gray-400 mt-1 uppercase tracking-[0.15em]">Keep the chain alive</p>
                </div>
                <div class="hidden sm:flex items-center gap-2 rounded-full bg-white/70 border border-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 shadow-sm">
                    <span class="h-2 w-2 rounded-full bg-[#FB7185]"></span>
                    Live streak
                </div>
            </div>

            <TouchStreakRibbon streak={touchStreak} />
        </section>

        <!-- WIDGET ROW: Smart Blocks -->
        <div class="grid grid-cols-2 gap-4">
            <!-- NEXT ANNIVERSARY -->
            {#if nextAnniversary !== null}
            <div class="relative overflow-hidden rounded-[36px] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-white flex flex-col justify-between aspect-square group transition-all duration-300 hover:shadow-lg">
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#DDD6FE]/20 text-[#8B5CF6] text-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-transform duration-500 group-hover:scale-110">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Next Anniv</p>
                    <p class="text-3xl font-black text-gray-900 tracking-tight leading-none">{nextAnniversary} <span class="text-[13px] font-bold text-gray-400 tracking-normal">days</span></p>
                </div>
            </div>
            {/if}

            <!-- UPCOMING PLAN -->
            <a href={closestPlan ? resolve('/date-plans/[id]', { id: closestPlan.id }) : resolve('/date-plans')} class="relative overflow-hidden rounded-[36px] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 flex flex-col justify-between aspect-square group hover:shadow-lg">
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#FED7AA]/20 text-[#EA580C] text-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-transform duration-500 group-hover:scale-110">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Up Next</p>
                    {#if closestPlan}
                        <p class="text-[16px] font-black text-gray-900 tracking-tight leading-tight truncate">{closestPlan.title}</p>
                        <p class="text-[12px] font-extrabold text-[#EA580C] mt-1">
                            {closestPlanDaysLeft === 0 ? 'Today!' : `in ${closestPlanDaysLeft} days`}
                        </p>
                    {:else}
                        <p class="text-[15px] font-black text-gray-400 tracking-tight leading-tight">No plans yet</p>
                        <p class="text-[11px] font-extrabold text-[#EA580C] mt-1">Tap to plan</p>
                    {/if}
                </div>
            </a>
        </div>

        <!-- LOVE NOTES SMART INBOX (Masterclass Upgrade) -->
        <a href={resolve('/love-notes')} class="group relative flex items-center justify-between overflow-hidden rounded-[36px] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 {lockedNotesCount > 0 ? 'ring-2 ring-[#FDA4AF]/40 shadow-[0_12px_40px_-10px_rgba(253,164,175,0.4)]' : ''}">
            <!-- Glow Effect di Background jika ada pesan -->
            {#if lockedNotesCount > 0}
                <div class="absolute -left-10 top-0 h-full w-32 bg-[#FDA4AF] opacity-10 blur-2xl animate-pulse pointer-events-none"></div>
            {/if}

            <div class="flex items-center gap-5 relative z-10">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#F8B4C8]/20 text-[#FDA4AF] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] relative transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5"/></svg>
                    {#if lockedNotesCount > 0}
                        <div class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white animate-bounce shadow-md">{lockedNotesCount}</div>
                    {/if}
                </div>
                <div>
                    <h3 class="text-[18px] font-black text-gray-900 tracking-tight leading-none mb-1">Secret Mailbox</h3>
                    <p class="text-[13px] font-bold text-gray-400 leading-snug">
                        {#if lockedNotesCount > 0}
                            You have <span class="text-[#FDA4AF]">{lockedNotesCount} locked note{lockedNotesCount > 1 ? 's' : ''}</span> waiting 💌
                        {:else}
                            Send a surprise message
                        {/if}
                    </p>
                </div>
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#FDA4AF]/15 group-hover:text-[#FDA4AF] transition-colors relative z-10">
                <svg class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </div>
        </a>

        <!-- CAMERA ROLL SECTION -->
        <section class="pt-4 -mx-6">
            <div class="mb-5 flex items-end justify-between px-6">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 tracking-tight">Camera Roll</h2>
                    <p class="text-[12px] font-black text-gray-400 mt-1 uppercase tracking-[0.15em]">Recent memories</p>
                </div>
                <a aria-label="See all memories" href={resolve('/memories')} class="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 hover:shadow-md transition-all duration-300 active:scale-90">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </a>
            </div>

            {#if memoriesQuery.isPending}
                <div class="flex gap-5 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    <div class="animate-pulse shrink-0 w-64 aspect-4/5 rounded-[36px] bg-white/60 shadow-sm border border-gray-100"></div>
                    <div class="animate-pulse shrink-0 w-64 aspect-4/5 rounded-[36px] bg-white/60 shadow-sm border border-gray-100"></div>
                </div>
            {:else if recentMemories.length === 0}
                <div class="mx-6 flex flex-col items-center justify-center rounded-[40px] bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.03)] border border-white py-14 px-6 text-center">
                    <div class="h-20 w-20 mb-5 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 border border-white shadow-inner">
                        <svg class="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="text-[17px] font-black text-gray-800 tracking-tight">No moments yet</p>
                    <p class="text-[13px] font-bold text-gray-400 mt-1">Start documenting your journey</p>
                </div>
            {:else}
                <div class="flex gap-5 overflow-x-auto pb-8 pt-2 px-6 snap-x hide-scrollbar">
                    {#each recentMemories as memory, i (memory.id)}
                        <a href={resolve('/memories/[id]', { id: memory.id })} class="shrink-0 w-64 snap-center relative rounded-[36px] overflow-hidden aspect-4/5 bg-gray-100 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 active:scale-95 group">
                            
                            <MemoryCover memoryId={memory.id} fallbackIndex={i} />

                            <div class="absolute inset-0 bg-linear-to-t from-gray-900/95 via-gray-900/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100 z-20 pointer-events-none"></div>

                            <div class="absolute inset-0 p-6 flex flex-col justify-between z-30 pointer-events-none">
                                <div class="flex justify-between items-start">
                                    <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3.5 py-1.5 shadow-sm">
                                        <span class="text-[10px] font-black uppercase tracking-[0.15em] text-white">
                                            {formatDateClean(memory.memory_date.toString())}
                                        </span>
                                    </div>
                                    {#if memory.mood}
                                        <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 shadow-sm">
                                            <span class="text-[10px] font-black uppercase tracking-widest text-white">{memory.mood}</span>
                                        </div>
                                    {/if}
                                </div>

                                <div class="transform transition-transform duration-500 ease-out group-hover:-translate-y-1">
                                    <h3 class="text-[26px] font-black text-white tracking-tight leading-[1.1] mb-2 drop-shadow-md line-clamp-2">{memory.title}</h3>
                                    {#if memory.location_name}
                                        <p class="flex items-center gap-1.5 text-[12px] font-bold text-white/80 mb-1 truncate">
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