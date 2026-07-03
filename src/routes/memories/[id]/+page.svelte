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
    import LocationMapPreview from '$lib/components/common/LocationMapPreview.svelte';
    import PhotoViewer from '$lib/components/common/PhotoViewer.svelte';
    import MediaPreview from '$lib/components/common/MediaPreview.svelte';
    import MemoryExportStudio from '$lib/components/memories/MemoryExportStudio.svelte';
    
    // Impor Komponen Form & Alert untuk Mode Edit
    import Input from '$lib/components/common/Input.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import LocationPicker from '$lib/components/common/LocationPicker.svelte';
    import TagsInput from '$lib/components/common/TagsInput.svelte';
    import AlertDialog from '$lib/components/common/AlertDialog.svelte';
    import DeleteButton from '$lib/components/common/DeleteButton.svelte';
    import DateTimePicker from '$lib/components/common/DateTimePicker.svelte'; // <-- Import ini

    const memoryId = page.params.id as string;
    const queryClient = useQueryClient();

    let isUploading = $state(false);
    let fileInput: HTMLInputElement;

    // --- STATES UNTUK MODE EDIT & DELETE ---
    let isEditing = $state(false);
    let isSaving = $state(false);
    let photoDeletingId = $state<string | null>(null);

    // State Alert Umum
    let alertState = $state({ isOpen: false, title: '', message: '' });

    // State Alert Hapus Foto Spesifik
    let photoToDelete = $state<string | null>(null);
    let isPhotoDeleteDialogOpen = $state(false);

    // Nilai form edit
    let editTitle = $state('');
    let editMemoryDate = $state('');
    let editDescription = $state('');
    let editMood = $state('');
    let editLocationName = $state('');
    let editLatitude = $state<number | undefined>(undefined);
    let editLongitude = $state<number | undefined>(undefined);
    let editTags = $state<string[]>([]);

    const moods = [
        { label: 'Happy', value: 'happy' },
        { label: 'Romantic', value: 'romantic' },
        { label: 'Excited', value: 'excited' },
        { label: 'Sad', value: 'sad' },
        { label: 'Chill', value: 'chill' }
    ];

    // Viewer States
    let isViewerOpen = $state(false);
    let activePhotoIndex = $state(0);
    let isExportStudioOpen = $state(false);

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
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

    let viewerPhotos = $derived(photos.map(p => ({
        id: p.id,
        photo_url: p.photo_url,
        media_type: p.media_type,
        caption: p.caption,
        memory_id: memoryId,
        memory_title: memory ? memory.title : '',
        memory_date: memory ? memory.memory_date : ''
    })));

    const formatDateClean = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- FUNGSI MULAI EDIT ---
    function startEditing() {
        if (!memory) return;
        editTitle = memory.title;
        // Ambil hanya YYYY-MM-DD
        editMemoryDate = memory.memory_date.split('T')[0];
        editDescription = memory.description || '';
        editMood = memory.mood || '';
        editLocationName = memory.location_name || '';
        editLatitude = memory.latitude;
        editLongitude = memory.longitude;
        editTags = memory.tags ? [...memory.tags] : [];
        isEditing = true;
    }

    // --- FUNGSI SIMPAN EDIT (UPDATE) ---
    async function handleSaveEdit(e: SubmitEvent) {
        e.preventDefault();
        isSaving = true;
        try {
            await memoryService.updateMemory(memoryId, {
                title: editTitle,
                memory_date: editMemoryDate,
                description: editDescription,
                mood: editMood,
                location_name: editLocationName,
                latitude: editLatitude,
                longitude: editLongitude,
                tags: editTags
            });
            
            // Invalidate cache global
            queryClient.invalidateQueries({ queryKey: ['memory', memoryId] });
            queryClient.invalidateQueries({ queryKey: ['memories'] });
            queryClient.invalidateQueries({ queryKey: ['couple-gallery'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            
            isEditing = false;
        } catch (error) {
            console.error(error);
            alertState = { isOpen: true, title: 'Error', message: 'Failed to update memory.' };
        } finally {
            isSaving = false;
        }
    }

    // --- FUNGSI HAPUS MEMORI (DELETE) ---
    async function handleDeleteMemory() {
        try {
            await memoryService.deleteMemory(memoryId);
            queryClient.invalidateQueries({ queryKey: ['memories'] });
            queryClient.invalidateQueries({ queryKey: ['couple-gallery'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            await goto(resolve('/memories'));
        } catch (error) {
            console.error(error);
            alertState = { isOpen: true, title: 'Error', message: 'Failed to delete memory.' };
        }
    }

    // --- FUNGSI HAPUS FOTO SPESIFIK ---
    function promptDeletePhoto(photoId: string) {
        photoToDelete = photoId;
        isPhotoDeleteDialogOpen = true;
    }

    async function confirmDeletePhoto() {
        if (!photoToDelete) return;
        photoDeletingId = photoToDelete;
        isPhotoDeleteDialogOpen = false;
        try {
            await photoService.deletePhoto(memoryId, photoToDelete);
            queryClient.invalidateQueries({ queryKey: ['memory-photos', memoryId] });
            queryClient.invalidateQueries({ queryKey: ['couple-gallery'] });
        } catch (error) {
            console.error(error);
            alertState = { isOpen: true, title: 'Error', message: 'Failed to delete media.' };
        } finally {
            photoDeletingId = null;
            photoToDelete = null;
        }
    }

    // --- FUNGSI UPLOAD FOTO ---
    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        isUploading = true;
        try {
            await photoService.uploadPhotos(memoryId, input.files);
            queryClient.invalidateQueries({ queryKey: ['memory-photos', memoryId] });
            queryClient.invalidateQueries({ queryKey: ['couple-gallery'] });
        } catch (error) {
            alertState = { isOpen: true, title: 'Upload Failed', message: 'Failed to upload media.' };
            console.error(error);
        } finally {
            isUploading = false;
            if (fileInput) fileInput.value = '';
        }
    }

    function openPhotoViewer(index: number) {
        // Jangan buka viewer jika sedang mode edit
        if (isEditing) return; 
        activePhotoIndex = index;
        isViewerOpen = true;
    }
</script>

<MobileShell>
    <!-- HEADER PINTAR -->
    <PageHeader 
        title={isEditing ? 'Edit Memory' : memory ? memory.title : 'Loading...'} 
        subtitle={isEditing ? '' : memory ? formatDateClean(memory.memory_date.toString()) : ''} 
        backUrl={isEditing ? undefined : "/memories"}
    >
        {#snippet rightContent()}
            {#if memory}
                <div class="flex items-center gap-2">
                    {#if isEditing}
                        <button onclick={() => isEditing = false} class="px-2 text-[13px] font-bold text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
                    {:else}
                        <button
                            aria-label="Export Memory"
                            onclick={() => isExportStudioOpen = true}
                            disabled={!photos.length}
                            class="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-700 transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v10m0 0l-3-3m3 3 3-3M5 20h14"/></svg>
                        </button>
                        <button aria-label="Edit Memory" onclick={startEditing} class="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-700 active:scale-90 transition-transform">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                    {/if}
                </div>
            {/if}
        {/snippet}
    </PageHeader>

    <main class="px-6 pt-6 pb-32 space-y-10">
        
        <!-- BLOK MODE EDIT -->
        {#if isEditing}
            <form onsubmit={handleSaveEdit} class="space-y-6">
                <Input label="Title" type="text" placeholder="e.g. Our First Trip" bind:value={editTitle} required />
                
                <!-- MENGGUNAKAN KOMPONEN BARU -->
                <DateTimePicker label="Date" type="date" bind:value={editMemoryDate} required />
                
                <LocationPicker 
                    bind:locationName={editLocationName} 
                    bind:latitude={editLatitude} 
                    bind:longitude={editLongitude} 
                />

                <Textarea 
                    label="Story" 
                    id="editStory"
                    bind:value={editDescription} 
                    rows={4} 
                    placeholder="Write down the beautiful details..."
                />

                <div class="flex flex-col gap-2 w-full">
                    <p class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Vibe / Mood</p>
                    <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-1 px-1 -mx-1">
                        {#each moods as m (m.value)}
                            <button 
                                type="button" 
                                onclick={() => editMood = m.value} 
                                class="shrink-0 px-6 py-3.5 rounded-full border transition-all duration-300 active:scale-95 flex items-center justify-center {editMood === m.value ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white/40 border-white/60 text-gray-500 hover:bg-white/60'}"
                            >
                                <span class="text-[12px] font-black uppercase tracking-widest">{m.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <TagsInput bind:tags={editTags} />

                <div class="pt-4">
                    <Button type="submit" class="w-full" isLoading={isSaving}>Save Changes</Button>
                </div>
            </form>

        <!-- BLOK MODE NORMAL (DETAIL) -->
        {:else}
            <section class="relative">
                <div class="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#FED7AA] opacity-20 blur-3xl pointer-events-none"></div>
                
                {#if memoryQuery.isPending}
                    <div class="space-y-4 mt-4">
                        <div class="h-10 w-3/4 animate-pulse rounded-xl bg-gray-200"></div>
                        <div class="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200"></div>
                    </div>
                {:else if memory}
                    <div class="pt-2">
                        <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">{memory.title}</h1>
                        
                        <div class="flex flex-wrap gap-2 mb-6 items-center">
                            {#if memory.location_name && (!memory.latitude || !memory.longitude)}
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm">
                                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    {memory.location_name}
                                </span>
                            {/if}
                            
                            {#if memory.mood}
                                <MoodBadge mood={memory.mood} />
                            {/if}
                        </div>

                        {#if memory.latitude && memory.longitude}
                            <div class="mb-6">
                                <LocationMapPreview 
                                    latitude={memory.latitude} 
                                    longitude={memory.longitude} 
                                    locationName={memory.location_name} 
                                />
                            </div>
                        {/if}

                        {#if memory.description}
                            <p class="text-[15px] font-medium text-gray-600 leading-relaxed tracking-wide mt-6">
                                {memory.description}
                            </p>
                        {/if}

                        {#if memory.tags && memory.tags.length > 0}
                            <div class="flex flex-wrap gap-2 mt-6">
                                {#each memory.tags as tag (tag)}
                                    <span class="inline-flex items-center rounded-full bg-white/40 backdrop-blur-xl border border-white/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                                        #{tag}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </section>
        {/if}

        <!-- GALLERY SECTION (Ditampilkan baik di Edit maupun Normal, dengan logika berbeda) -->
        <section>
            <div class="flex items-center justify-between mb-6">
                <div class="flex flex-col">
                    <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Media</h2>
                    <span class="text-[13px] font-bold text-gray-400">
                        {isEditing ? 'Manage media' : `${photos.length} media items`}
                    </span>
                </div>
                
                <input type="file" multiple accept="image/*,video/*" class="hidden" bind:this={fileInput} onchange={handleFileSelect} />
                
                <Button variant="secondary" size="md" class="h-10 px-4 text-[12px] bg-white/60 border-white text-gray-800 shadow-sm" onclick={() => fileInput.click()} isLoading={isUploading}>
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    Add Media
                </Button>
            </div>
            <p class="-mt-2 mb-4 text-[11px] font-bold text-gray-400">
                Supports images and videos.
            </p>

            {#if photosQuery.isPending}
                <div class="grid grid-cols-2 gap-4">
                    <div class="animate-pulse aspect-3/4 rounded-3xl bg-white/50 border border-gray-100 shadow-sm"></div>
                    <div class="animate-pulse aspect-3/4 rounded-3xl bg-white/50 border border-gray-100 shadow-sm"></div>
                </div>
            {:else if photos.length === 0}
                <div class="flex flex-col items-center justify-center py-12 px-6 text-center opacity-80">
                    <div class="h-16 w-16 mb-4 rounded-[20px] bg-[#DDD6FE]/30 flex items-center justify-center text-[#8B5CF6] -rotate-6">
                        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <p class="text-lg font-black text-gray-800 tracking-tight">No media yet</p>
                    <p class="text-sm font-medium text-gray-500 mt-1 max-w-50">Upload images or videos to complete this story.</p>
                </div>
            {:else}
                <div class="grid grid-cols-2 gap-4">
                    {#each photos as photo, i (photo.id)}
                        <div class="group relative aspect-3/4 overflow-hidden rounded-3xl bg-gray-100 shadow-sm border border-white/60">
                            <!-- Tombol Viewer (Normal) atau Tombol Pasif (Edit) -->
                            <button 
                                type="button"
                                onclick={() => openPhotoViewer(i)}
                                class="h-full w-full outline-none text-left transition-transform active:scale-95 {isEditing ? 'cursor-default active:scale-100' : 'hover:scale-[1.01]'}"
                            >
                                <MediaPreview
                                    src={photo.photo_url}
                                    mediaType={photo.media_type}
                                    alt="Memory"
                                    class="h-full w-full"
                                    mediaClass={`object-cover transition-transform duration-700 ease-out ${isEditing ? '' : 'group-hover:scale-105'}`}
                                    loading="lazy"
                                    showBadge={true}
                                />
                                {#if !isEditing}
                                    <div class="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                {/if}
                            </button>

                            <!-- OVERLAY DELETE (Hanya Muncul Saat Mode Edit) -->
                            {#if isEditing}
                                <div class="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[2px]">
                                    {#if photoDeletingId === photo.id}
                                        <svg class="h-8 w-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {:else}
                                        <button 
                                            type="button" 
                                            onclick={() => promptDeletePhoto(photo.id)}
                                            class="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-90 transition-transform"
                                            aria-label="Delete Media"
                                        >
                                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

        <!-- TOMBOL HAPUS MEMORI -->
        {#if memory && isEditing}
            <section class="pt-6 border-t border-red-200/50">
                <DeleteButton 
                    label="Delete Memory Entirely"
                    dialogTitle="Delete Memory"
                    dialogMessage="Are you sure you want to delete this memory? All photos attached to it will also be lost forever."
                    confirmText="Delete Memory"
                    onDelete={handleDeleteMemory}
                />
                <p class="text-center text-[11px] font-bold text-gray-400 mt-3 px-4">
                    Danger zone: Deleting this memory will also wipe out all its photos.
                </p>
            </section>
        {/if}
    </main>

    <!-- FLOATING EXCLUSIVE VIEWER -->
    <PhotoViewer 
        photos={viewerPhotos} 
        bind:activeIndex={activePhotoIndex} 
        bind:isOpen={isViewerOpen} 
    />

    <MemoryExportStudio
        bind:isOpen={isExportStudioOpen}
        title={memory?.title || 'Memory'}
        memoryDate={memory?.memory_date}
        items={photos}
        defaultIndex={activePhotoIndex}
    />
</MobileShell>

<AlertDialog 
    bind:isOpen={alertState.isOpen} 
    title={alertState.title} 
    message={alertState.message} 
/>

<AlertDialog 
    bind:isOpen={isPhotoDeleteDialogOpen}
    title="Delete Media"
    message="Are you sure you want to delete this media?"
    confirmText="Delete Media"
    cancelText="Cancel"
    isDestructive={true}
    onConfirm={confirmDeletePhoto}
/>