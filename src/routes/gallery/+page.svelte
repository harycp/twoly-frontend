<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { photoService } from '$lib/services/photo.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PhotoViewer from '$lib/components/common/PhotoViewer.svelte';

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    const galleryQuery = createQuery(() => ({
        queryKey: ['couple-gallery'],
        queryFn: () => photoService.getGalleryPhotos()
    }));

    let allPhotos = $derived(galleryQuery.data || []);
    let searchQuery = $state('');

    type ViewMode = 'years' | 'months' | 'days' | 'all';
    let currentMode = $state<ViewMode>('all');

    let filteredPhotos = $derived.by(() => {
        if (!searchQuery.trim()) return allPhotos;
        const q = searchQuery.toLowerCase().trim();
        return allPhotos.filter(p => 
            p.memory.title.toLowerCase().includes(q) || 
            (p.caption && p.caption.toLowerCase().includes(q)) ||
            (p.memory.location_name && p.memory.location_name.toLowerCase().includes(q))
        );
    });

    let photosByYear = $derived.by(() => {
        const groups: Record<string, typeof allPhotos> = {};
        filteredPhotos.forEach(p => {
            const year = new Date(p.memory.memory_date).getFullYear().toString();
            if (!groups[year]) groups[year] = [];
            groups[year].push(p);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    });

    let photosByMonth = $derived.by(() => {
        const groups: Record<string, typeof allPhotos> = {};
        filteredPhotos.forEach(p => {
            const date = new Date(p.memory.memory_date);
            const key = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[1][0].memory.memory_date);
            const dateB = new Date(b[1][0].memory.memory_date);
            return dateB.getTime() - dateA.getTime();
        });
    });

    let photosByDay = $derived.by(() => {
        const groups: Record<string, typeof allPhotos> = {};
        filteredPhotos.forEach(p => {
            const dateStr = p.memory.memory_date.split('T')[0];
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(p);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    });

    let isViewerOpen = $state(false);
    let activePhotoIndex = $state(0);
    const viewModes: ViewMode[] = ['years', 'months', 'days', 'all'];

    let viewerPhotos = $derived(filteredPhotos.map(p => ({
        id: p.id,
        photo_url: p.photo_url,
        caption: p.caption,
        memory_id: p.memory.id,
        memory_title: p.memory.title,
        memory_date: p.memory.memory_date
    })));

    function openViewer(index: number) {
        activePhotoIndex = index;
        isViewerOpen = true;
    }

    const formatDayTitle = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const isCurrentYear = date.getFullYear() === today.getFullYear();
        return date.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long',
            year: isCurrentYear ? undefined : 'numeric'
        });
    };
</script>

<MobileShell>
    <header class="sticky top-0 z-40 bg-[#FFF7ED]/95 backdrop-blur-2xl border-b border-[#F8B4C8]/20 pt-10 pb-4 flex flex-col gap-4 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.03)] transition-all">

        <div class="px-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a aria-label="Back to timeline" href={resolve('/memories')} class="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-white/60 text-gray-900 transition-transform active:scale-90 hover:bg-gray-50">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                </a>
                <h1 class="text-3xl font-black text-gray-900 tracking-tight leading-none">Gallery</h1>
            </div>
        </div>

        <div class="px-6">
            <div class="relative flex items-center">
                <input
                    type="text"
                    placeholder="Search moments, locations..."
                    bind:value={searchQuery}
                    class="h-12 w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl pl-12 pr-4 text-[13px] font-bold text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-[#FDA4AF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FDA4AF]/15 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]"
                />
                <div class="absolute left-4 text-[#FDA4AF] pointer-events-none">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
            </div>
        </div>

        <div class="px-6">
            <div class="flex p-1.5 bg-white/40 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]">
                {#each viewModes as mode (mode)}
                    <button
                        type="button"
                        onclick={() => currentMode = mode}
                        class="flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-[14px] transition-all duration-300 {currentMode === mode ? 'bg-white text-[#FDA4AF] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)] border border-gray-50' : 'text-gray-400 hover:text-gray-600'}"
                    >
                        {mode}
                    </button>
                {/each}
            </div>
        </div>
    </header>

    <main class="min-h-screen pb-40">
        {#if galleryQuery.isPending}
            <div class="grid grid-cols-4 gap-0.5 pt-0.5">
                {#each Array.from({ length: 24 }, (_, idx) => idx) as idx (idx)}
                    <div class="animate-pulse aspect-square bg-white/50 border border-gray-100"></div>
                {/each}
            </div>
            
        {:else if filteredPhotos.length === 0}
            <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div class="h-20 w-20 mb-5 rounded-3xl bg-[#F8B4C8]/20 border border-white flex items-center justify-center text-[#FDA4AF] shadow-inner rotate-3">
                    <svg class="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <h3 class="text-xl font-black text-gray-900 tracking-tight">Empty Frame</h3>
                <p class="text-[13px] font-medium text-gray-500 mt-2 max-w-60">
                    {searchQuery ? "No matches found for your search." : "No pictures saved yet. Go upload some in your Memories!"}
                </p>
            </div>
            
        {:else}
            {#if currentMode === 'years'}
                <div class="space-y-10 pt-6 px-6">
                    {#each photosByYear as [year, photosList] (year)}
                        <div class="space-y-4">
                            <h2 class="text-4xl font-black text-gray-900 tracking-tight pl-1">{year}</h2>
                            <div class="grid grid-cols-2 gap-3">
                                {#each photosList.slice(0, 4) as photo (photo.id)}
                                    {@const realIndex = filteredPhotos.findIndex(p => p.id === photo.id)}
                                    <button onclick={() => openViewer(realIndex)} class="relative aspect-square bg-gray-100 rounded-[20px] overflow-hidden shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-white/60 active:scale-95 transition-transform group">
                                        <img src={photo.photo_url} alt="Cover" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

            {:else if currentMode === 'months'}
                <div class="space-y-8 pt-6 px-4">
                    {#each photosByMonth as [monthStr, photosList] (monthStr)}
                        <div class="space-y-3">
                            <h3 class="text-2xl font-black text-gray-900 tracking-tight pl-2">{monthStr}</h3>
                            <div class="grid grid-cols-3 gap-2">
                                {#each photosList.slice(0, 9) as photo (photo.id)}
                                    {@const realIndex = filteredPhotos.findIndex(p => p.id === photo.id)}
                                    <button onclick={() => openViewer(realIndex)} class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-white/60 active:scale-95 transition-transform group">
                                        <img src={photo.photo_url} alt="Month item" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

            {:else if currentMode === 'days'}
                <div class="space-y-10 pt-6 px-2">
                    {#each photosByDay as [dateStr, photosList] (dateStr)}
                        <div class="space-y-3">
                            <div class="flex items-end justify-between pl-3 pr-4">
                                <h3 class="text-lg font-black text-gray-900 tracking-tight">{formatDayTitle(dateStr)}</h3>
                                {#if photosList[0].memory.title}
                                    <span class="text-[11px] font-bold text-gray-400 truncate max-w-[40%] flex items-center gap-1">
                                        <svg class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                        {photosList[0].memory.title}
                                    </span>
                                {/if}
                            </div>
                            
                            <div class="grid grid-cols-4 gap-0.5">
                                {#each photosList as photo, i (photo.id)}
                                    {@const realIndex = filteredPhotos.findIndex(p => p.id === photo.id)}
                                    <button 
                                        onclick={() => openViewer(realIndex)} 
                                        class="relative bg-gray-100 overflow-hidden active:opacity-70 transition-opacity {i === 0 && photosList.length >= 3 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}"
                                    >
                                        <img src={photo.photo_url} alt="Day item" class="h-full w-full object-cover" loading="lazy" />
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

            {:else}
                <div class="grid grid-cols-4 gap-0.5 pt-0.5">
                    {#each filteredPhotos as photo, i (photo.id)}
                        <button 
                            type="button"
                            onclick={() => openViewer(i)}
                            class="relative aspect-square bg-gray-100 overflow-hidden active:opacity-70 transition-opacity"
                        >
                            <img src={photo.photo_url} alt="All Photos" class="h-full w-full object-cover" loading="lazy" />
                        </button>
                    {/each}
                </div>
            {/if}
        {/if}
    </main>

    <!-- VIEWER EKSKLUSIF (Z-INDEX SUPER TINGGI) -->
    <PhotoViewer 
        photos={viewerPhotos} 
        bind:activeIndex={activePhotoIndex} 
        bind:isOpen={isViewerOpen} 
    />
</MobileShell>