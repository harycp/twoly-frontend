<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { fade, scale } from 'svelte/transition';
    import { resolve } from '$app/paths';
    import { uiStore } from '$lib/stores/ui.store.svelte'; // Impor UI Store

    interface ViewerPhoto {
        id: string;
        photo_url: string;
        caption?: string;
        created_at?: string;
        memory_id?: string;
        memory_title?: string;
        memory_date?: string;
    }

    interface Props {
        photos: ViewerPhoto[];
        activeIndex: number;
        isOpen: boolean;
    }

    let { photos, activeIndex = $bindable(0), isOpen = $bindable(false) }: Props = $props();

    let currentPhoto = $derived(photos[activeIndex]);
    let showControls = $state(true); // Toggle UI controls on tap

    function next() {
        if (activeIndex < photos.length - 1) activeIndex += 1;
        else activeIndex = 0;
    }

    function prev() {
        if (activeIndex > 0) activeIndex -= 1;
        else activeIndex = photos.length - 1;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!isOpen) return;
        if (e.key === 'Escape') isOpen = false;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    }

    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e: TouchEvent) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        if (diffY < -100 && Math.abs(diffY) > Math.abs(diffX)) {
            isOpen = false;
            return;
        }

        if (Math.abs(diffX) > 50) {
            if (diffX > 0) next();
            else prev();
        }
    }

    $effect(() => {
        if (isOpen) {
            uiStore.isNavHidden = true; 
            showControls = true;
            if (browser) document.body.style.overflow = 'hidden';
        } else {
            uiStore.isNavHidden = false; 
            if (browser) document.body.style.overflow = '';
        }
    });

    onMount(() => { if (browser) window.addEventListener('keydown', handleKeydown); });
    onDestroy(() => { if (browser) window.removeEventListener('keydown', handleKeydown); });
</script>

{#if isOpen && currentPhoto}
    <!-- Backdrop Layar Penuh Hitam Pekat (z-50 di sini cukup karena kita memakai Fixed di Parent Level) -->
    <div 
        transition:fade={{ duration: 300 }}
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
    >
        <!-- Area Klik untuk Foto -->
        <button 
            type="button"
            class="absolute inset-0 z-0 h-full w-full outline-none cursor-default touch-none"
            onclick={() => showControls = !showControls}
            ontouchstart={handleTouchStart}
            ontouchend={handleTouchEnd}
            aria-label="Toggle controls"
        >
            {#key currentPhoto.id}
                <img 
                    src={currentPhoto.photo_url} 
                    alt="Focused Memory" 
                    transition:scale={{ duration: 300, start: 0.98 }}
                    class="h-full w-full object-contain pointer-events-none"
                />
            {/key}
        </button>

        <!-- TOP CONTROLS -->
        {#if showControls}
            <div transition:fade={{ duration: 200 }} class="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                <div class="flex flex-col">
                    {#if currentPhoto.memory_date}
                        <span class="text-[13px] font-bold text-white tracking-wide">
                            {new Date(currentPhoto.memory_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    {/if}
                    <span class="text-[10px] font-bold text-white/50 tracking-wider">
                        {activeIndex + 1} OF {photos.length}
                    </span>
                </div>
                
                <button 
                    type="button"
                    onclick={() => isOpen = false}
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md active:scale-90 transition-all"
                >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        {/if}

        <!-- BOTTOM CONTROLS -->
        {#if showControls}
            <div transition:fade={{ duration: 200 }} class="absolute bottom-0 left-0 right-0 z-10 p-6 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4">
                <div class="flex items-end justify-between gap-4">
                    <div class="flex-1">
                        {#if currentPhoto.memory_title}
                            <h3 class="text-base font-black tracking-tight text-white mb-1">
                                {currentPhoto.memory_title}
                            </h3>
                        {/if}
                        {#if currentPhoto.caption}
                            <p class="text-sm font-medium text-white/80 line-clamp-2">
                                {currentPhoto.caption}
                            </p>
                        {/if}
                    </div>

                    <!-- Tombol Memory Detail -->
                    {#if currentPhoto.memory_id}
                        <a 
                            href={resolve(`/memories/${currentPhoto.memory_id}` as any)}
                            onclick={() => isOpen = false}
                            class="shrink-0 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md text-white px-4 py-2 text-[11px] font-bold tracking-wide transition-all active:scale-95"
                        >
                            Story
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                        </a>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- DESKTOP ARROWS -->
        {#if showControls}
            <button transition:fade type="button" onclick={(e) => { e.stopPropagation(); prev(); }} class="hidden md:flex absolute left-4 z-20 h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/20 transition-all border border-white/10"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg></button>
            <button transition:fade type="button" onclick={(e) => { e.stopPropagation(); next(); }} class="hidden md:flex absolute right-4 z-20 h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/20 transition-all border border-white/10"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></button>
        {/if}
    </div>
{/if}