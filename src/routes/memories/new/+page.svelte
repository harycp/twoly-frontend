<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { memoryService } from '$lib/services/memory.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import LocationPicker from '$lib/components/common/LocationPicker.svelte';
    import TagsInput from '$lib/components/common/TagsInput.svelte';

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    let title = $state('');
    let memory_date = $state(new Date().toISOString().split('T')[0]);
    let description = $state('');
    let mood = $state('');
    
    // State baru untuk mengakomodasi LocationPicker & TagsInput
    let location_name = $state('');
    let latitude = $state<number | undefined>(undefined);
    let longitude = $state<number | undefined>(undefined);
    let tags = $state<string[]>([]);
    
    let isLoading = $state(false);
    let errorMessage = $state('');

    const moods = [
        { label: 'Happy', value: 'happy' },
        { label: 'Romantic', value: 'romantic' },
        { label: 'Excited', value: 'excited' },
        { label: 'Sad', value: 'sad' },
        { label: 'Chill', value: 'chill' }
    ];

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            await memoryService.createMemory({ 
                title, 
                memory_date, 
                location_name, 
                latitude, 
                longitude, 
                description, 
                mood, 
                tags 
            });
            await goto(resolve('/memories' as any));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to save your moment.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title="New Moment" backUrl="/memories" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50/80 backdrop-blur-md p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-6">
            <Input label="Title" type="text" placeholder="e.g. Our First Trip to Bali" bind:value={title} required />
            
            <Input label="Date" type="date" bind:value={memory_date} required />
            
            <!-- MENGGUNAKAN REUSABLE COMPONENT LOCATION PICKER DENGAN GPS -->
            <LocationPicker 
                bind:locationName={location_name} 
                bind:latitude={latitude} 
                bind:longitude={longitude} 
            />

            <Textarea 
                label="Story" 
                id="story"
                bind:value={description} 
                rows={4} 
                placeholder="Write down the beautiful details here..."
            />

            <div class="flex flex-col gap-2 w-full">
                <label class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Vibe / Mood</label>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-1 px-1 -mx-1">
                    {#each moods as m (m.value)}
                        <button 
                            type="button" 
                            onclick={() => mood = m.value} 
                            class="shrink-0 px-6 py-3.5 rounded-full border transition-all duration-300 active:scale-95 flex items-center justify-center {mood === m.value ? 'bg-gray-900 border-gray-900 text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)]' : 'bg-white/70 border-white/60 text-gray-500 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)] hover:border-gray-200 hover:bg-white'}"
                        >
                            <span class="text-[12px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- MENGGUNAKAN REUSABLE COMPONENT TAGS INPUT -->
            <TagsInput bind:tags={tags} />

            <div class="pt-4">
                <Button type="submit" class="w-full" {isLoading}>Save Memory</Button>
            </div>
        </form>
    </main>
</MobileShell>

<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    input[type="date"]::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; }
</style>