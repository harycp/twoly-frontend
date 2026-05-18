<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import LocationPicker from '$lib/components/common/LocationPicker.svelte';
    import TagsInput from '$lib/components/common/TagsInput.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import DateTimePicker from '$lib/components/common/DateTimePicker.svelte'; // <-- Komponen baru

    let title = $state('');
    let memoryDate = $state('');
    let description = $state('');
    let mood = $state('');
    let locationName = $state('');
    let latitude = $state<number | undefined>(undefined);
    let longitude = $state<number | undefined>(undefined);
    let tags = $state<string[]>([]);

    let isLoading = $state(false);
    let errorMessage = $state('');

    const queryClient = useQueryClient();

    const moods = [
        { label: 'Happy', value: 'happy' },
        { label: 'Romantic', value: 'romantic' },
        { label: 'Excited', value: 'excited' },
        { label: 'Sad', value: 'sad' },
        { label: 'Chill', value: 'chill' }
    ];

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            await memoryService.createMemory({ 
                title, 
                memory_date: memoryDate, 
                location_name: locationName, 
                latitude, 
                longitude, 
                description, 
                mood, 
                tags 
            });
            
            // Invalidate cache global agar list memory, galeri, dan kalender langsung update!
            queryClient.invalidateQueries({ queryKey: ['memories'] });
            queryClient.invalidateQueries({ queryKey: ['couple-gallery'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

            await goto(resolve('/memories'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to create memory.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title="New Memory" subtitle="Frame a beautiful moment" backUrl="/memories" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-6">
            <Input label="Title" type="text" placeholder="e.g. Our First Trip" bind:value={title} required />
            
            <!-- MENGGUNAKAN DATETIME PICKER CANGGIH -->
            <DateTimePicker label="Date" type="date" bind:value={memoryDate} required />
            
            <LocationPicker 
                bind:locationName={locationName} 
                bind:latitude={latitude} 
                bind:longitude={longitude} 
            />

            <Textarea 
                label="Story" 
                bind:value={description} 
                rows={4} 
                placeholder="Write down the beautiful details..."
            />

            <div class="flex flex-col gap-2 w-full">
                <p class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Vibe / Mood</p>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-1 px-1 -mx-1">
                    {#each moods as m (m.value)}
                        <button 
                            type="button" 
                            onclick={() => mood = m.value} 
                            class="shrink-0 px-6 py-3.5 rounded-full border transition-all duration-300 active:scale-95 flex items-center justify-center {mood === m.value ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white/40 border-white/60 text-gray-500 hover:bg-white/60'}"
                        >
                            <span class="text-[12px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <TagsInput bind:tags />

            <div class="pt-6">
                <Button type="submit" class="w-full shadow-lg" {isLoading}>Save Memory</Button>
            </div>
        </form>
    </main>
</MobileShell>

<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>