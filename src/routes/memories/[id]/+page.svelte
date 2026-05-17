<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    import { photoService } from '$lib/services/photo.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import MoodBadge from '$lib/components/memories/MoodBadge.svelte';
    import Button from '$lib/components/common/Button.svelte';

    const memoryId = page.params.id;
    const queryClient = useQueryClient();

    let isUploading = $state(false);
    let fileInput: HTMLInputElement;

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    const memoryQuery = createQuery(() => ({
        queryKey: ['memory', memoryId],
        queryFn: () => memoryService.getMemoryDetail(memoryId)
    }));

    const photosQuery = createQuery(() => ({
        queryKey: ['memory-photos', memoryId],
        queryFn: () => photoService.getPhotos(memoryId)
    }));

    let memory = $derived(memoryQuery.data);
    let photos = $derived(photosQuery.data || []);

    const formatDateClean = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        isUploading = true;
        try {
            await photoService.uploadPhotos(memoryId, input.files);
            queryClient.invalidateQueries({ queryKey: ['memory-photos', memoryId] });
        } catch (error) {
            alert('Failed to upload photos. Please try again.');
            console.error(error);
        } finally {
            isUploading = false;
            if (fileInput) fileInput.value = '';
        }
    }
</script>

<MobileShell>
    <!-- MENGGUNAKAN REUSABLE PAGE HEADER -->
    <PageHeader 
        title={memory ? memory.title : 'Loading...'} 
        subtitle={memory ? formatDateClean(memory.memory_date) : ''} 
        backUrl="/memories" 
    />

    <main class="px-6 pt-6 pb-32 space-y-10">
        
        <!-- MEMORY DETAILS: TANPA KOTAK PUTIH KAKU -->
        <section class="relative">
            <!-- Dekorasi blur sangat subtle di background -->
            <div class="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#FED7AA] opacity-20 blur-3xl pointer-events-none"></div>
            
            {#if memoryQuery.isPending}
                <div class="space-y-4 mt-4">
                    <div class="h-10 w-3/4 animate-pulse rounded-xl bg-gray-200"></div>
                    <div class="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200"></div>
                    <div class="h-20 w-full animate-pulse rounded-2xl bg-gray-200 mt-4"></div>
                </div>
            {:else if memory}
                <div class="pt-2">
                    <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">{memory.title}</h1>
                    
                    <div class="flex flex-wrap gap-2 mb-6">
                        {#if memory.location_name}
                            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/60 border border-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                {memory.location_name}
                            </span>
                        {/if}
                        
                        {#if memory.mood}
                            <!-- MENGGUNAKAN REUSABLE COMPONENT -->
                            <MoodBadge mood={memory.mood} />
                        {/if}
                    </div>

                    {#if memory.description}
                        <p class="text-[15px] font-medium text-gray-600 leading-relaxed tracking-wide">
                            {memory.description}
                        </p>
                    {/if}
                </div>
            {/if}
        </section>

        <!-- GALLERY SECTION DENGAN POSISI UPLOAD YANG BENAR -->
        <section>
            <!-- Title & Tombol Upload sejajar, terstruktur rapi -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex flex-col">
                    <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Gallery</h2>
                    <span class="text-[13px] font-bold text-gray-400">{photos.length} photos</span>
                </div>
                
                <!-- Hidden File Input -->
                <input type="file" multiple accept="image/*" class="hidden" bind:this={fileInput} onchange={handleFileSelect} />
                
                <!-- Tombol Natural, tidak nyempil di bawah -->
                <Button 
                    variant="secondary" 
                    size="md" 
                    class="h-10 px-4 text-xs bg-white shadow-sm" 
                    onclick={() => fileInput.click()}
                    isLoading={isUploading}
                >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Add Photos
                </Button>
            </div>

            {#if photosQuery.isPending}
                <div class="grid grid-cols-2 gap-4">
                    <div class="animate-pulse aspect-[3/4] rounded-[24px] bg-white border border-gray-100 shadow-sm"></div>
                    <div class="animate-pulse aspect-[3/4] rounded-[24px] bg-white border border-gray-100 shadow-sm"></div>
                </div>
            {:else if photos.length === 0}
                <!-- EMPTY STATE: Bersih dan menyatu tanpa kotak aneh -->
                <div class="flex flex-col items-center justify-center py-12 px-6 text-center opacity-80">
                    <div class="h-16 w-16 mb-4 rounded-[20px] bg-[#DDD6FE]/30 flex items-center justify-center text-[#8B5CF6] rotate-[-6deg]">
                        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="text-lg font-black text-gray-800 tracking-tight">No photos yet</p>
                    <p class="text-sm font-medium text-gray-500 mt-1 max-w-[200px]">Upload memories to complete this story.</p>
                </div>
            {:else}
                <!-- MASONRY / GRID GALLERY -->
                <div class="grid grid-cols-2 gap-4">
                    {#each photos as photo (photo.id)}
                        <div class="group relative aspect-[3/4] overflow-hidden rounded-[24px] bg-gray-100 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)]">
                            <img src={photo.photo_url} alt="Memory" class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

    </main>
</MobileShell>