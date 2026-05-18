<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import MemoryCover from '$lib/components/memories/MemoryCover.svelte';

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    const memoriesQuery = createQuery(() => ({
        queryKey: ['memories'],
        queryFn: () => memoryService.getMemories()
    }));

    let memories = $derived(memoriesQuery.data || []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });
    };
</script>

<MobileShell>
    <!-- STICKY HEADER: Glassmorphism & Premium typography -->
    <header class="sticky top-0 z-40 px-6 pt-12 pb-4 bg-[#FFF7ED]/90 backdrop-blur-2xl border-b border-[#F8B4C8]/20 flex items-center justify-between transition-all">
        <div class="space-y-0.5">
            <h1 class="text-3xl font-black text-gray-900 tracking-tight leading-none">Camera Roll</h1>
            <p class="text-sm font-semibold text-gray-400 tracking-wide">Your cinematic journey</p>
        </div>
        
        <!-- Action Buttons: Album & New Memory -->
        <div class="flex items-center gap-3">
            <!-- Shared Gallery Album Button -->
            <a aria-label="View album" href={resolve('/gallery')} class="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 shadow-sm transition-all duration-300 active:scale-90 hover:text-gray-900 hover:bg-gray-50">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </a>
            
            <!-- Add Button: Sleek & Professional -->
            <a aria-label="Add new memory" href={resolve('/memories/new')} class="group flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-300 active:scale-90 hover:bg-gray-800 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)]">
                <svg class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            </a>
        </div>
    </header>

    <main class="px-6 pt-6 pb-32 space-y-6">
        {#if memoriesQuery.isPending}
            <!-- LOADING STATE: Premium Skeleton -->
            <div class="space-y-6">
                <div class="animate-pulse w-full aspect-[4/5] rounded-[36px] bg-white/50 shadow-sm border border-gray-100"></div>
                <div class="animate-pulse w-full aspect-[4/5] rounded-[36px] bg-white/50 shadow-sm border border-gray-100"></div>
            </div>
            
        {:else if memories.length === 0}
            <!-- EMPTY STATE: Seamless & Cozy Scrapbook Slot -->
            <div class="mt-8 flex w-full flex-col items-center justify-center rounded-[40px] border-[3px] border-dashed border-[#F8B4C8]/40 bg-white/30 py-20 px-6 text-center backdrop-blur-sm">
                <!-- Floating Icon container -->
                <div class="relative mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-[0_8px_20px_-6px_rgba(253,164,175,0.3)] rotate-[-3deg] transition-all duration-300 hover:rotate-0">
                    <svg class="h-8 w-8 text-[#FDA4AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
                
                <h2 class="mb-3 text-2xl font-black tracking-tight text-gray-900">Blank Canvas</h2>
                <p class="max-w-[250px] text-[15px] font-medium leading-relaxed text-gray-500">
                    Every beautiful story needs a beginning. Tap the <span class="font-bold text-[#FDA4AF]">+</span> above to frame your first moment.
                </p>
            </div>
            
        {:else}
            <!-- TIMELINE / FEED: Full Bleed Cinematic Cards -->
            <div class="space-y-6">
                {#each memories as memory, i (memory.id)}
                    <!-- MEMORY CARD -->
                    <a href={resolve('/memories/[id]', { id: memory.id })} class="block group relative overflow-hidden rounded-[36px] bg-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.06)] border border-gray-50/50 transition-all duration-500 ease-out active:scale-[0.98]">
                        
                        <!-- Image Area (Cinematic Aspect Ratio 4:5) -->
                        <div class="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
                            
                            <!-- MENGGUNAKAN KOMPONEN MEMORY COVER CERDAS -->
                            <MemoryCover memoryId={memory.id} fallbackIndex={i} />

                            <!-- Cinematic Vignette -->
                            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100 z-20 pointer-events-none"></div>

                            <!-- Content Overlay -->
                            <div class="absolute inset-0 p-6 flex flex-col justify-between z-30 pointer-events-none">
                                
                                <!-- Header Badges -->
                                <div class="flex justify-between items-start">
                                    <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-4 py-1.5 shadow-sm">
                                        <span class="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white">
                                            {formatDate(memory.memory_date.toString())}
                                        </span>
                                    </div>
                                    
                                    {#if memory.mood}
                                        <div class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 shadow-sm">
                                            <span class="text-[10px] font-black uppercase tracking-widest text-white">
                                                {memory.mood}
                                            </span>
                                        </div>
                                    {/if}
                                </div>

                                <!-- Footer Content -->
                                <div class="transform transition-transform duration-500 ease-out group-hover:-translate-y-1">
                                    <h3 class="text-3xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-sm">
                                        {memory.title}
                                    </h3>
                                    
                                    {#if memory.location_name}
                                        <p class="flex items-center gap-1.5 text-sm font-semibold text-white/80 mb-3">
                                            <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            {memory.location_name}
                                        </p>
                                    {/if}

                                    {#if memory.tags && memory.tags.length > 0}
                                        <div class="flex flex-wrap gap-2 mt-4 opacity-90">
                                            {#each memory.tags.slice(0, 3) as tag (tag)}
                                                <span class="text-[11px] font-extrabold uppercase tracking-widest text-white/70">
                                                    #{tag}
                                                </span>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </main>
</MobileShell>