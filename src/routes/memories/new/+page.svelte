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
    import Button from '$lib/components/common/Button.svelte';

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    let title = $state('');
    let memory_date = $state(new Date().toISOString().split('T')[0]);
    let location_name = $state('');
    let description = $state('');
    let tagsInput = $state('');
    let mood = $state('');
    
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
            const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
            await memoryService.createMemory({ title, memory_date, location_name, description, mood, tags });
            await goto(resolve('/memories' as any));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to save your moment.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <!-- MENGGUNAKAN REUSABLE PAGE HEADER -->
    <PageHeader title="New Moment" backUrl="/memories" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <!-- FORM TANPA KOTAK PUTIH: Langsung menyatu di atas background Cream (#FFF7ED) -->
        <form onsubmit={handleSubmit} class="space-y-6">
            <Input label="Title" type="text" placeholder="e.g. Our First Trip to Bali" bind:value={title} required />
            <Input label="Date" type="date" bind:value={memory_date} required />
            <Input label="Location" type="text" placeholder="Where did this happen?" bind:value={location_name} />

            <div class="flex flex-col gap-2 w-full">
                <label for="story" class="text-sm font-extrabold text-gray-700 tracking-tight ml-1">Story</label>
                <!-- Textarea sengaja diberi background putih agar kontras dengan cream secara soft -->
                <textarea 
                    id="story"
                    bind:value={description} 
                    rows="4" 
                    class="w-full rounded-[24px] border border-white bg-white/70 backdrop-blur-sm p-5 text-base font-medium text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-[#FDA4AF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FDA4AF]/15 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] resize-none" 
                    placeholder="Write down the beautiful details here..."
                ></textarea>
            </div>

            <div class="flex flex-col gap-2 w-full">
                <label class="text-sm font-extrabold text-gray-700 tracking-tight ml-1">Vibe / Mood</label>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-4 pt-1 px-1 -mx-1">
                    {#each moods as m (m.value)}
                        <button 
                            type="button" 
                            onclick={() => mood = m.value} 
                            class="shrink-0 px-6 py-3.5 rounded-full border transition-all duration-300 active:scale-95 flex items-center justify-center {mood === m.value ? 'bg-gray-900 border-gray-900 text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)]' : 'bg-white/70 border-white text-gray-500 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.03)] hover:border-gray-200 hover:bg-white'}"
                        >
                            <span class="text-[12px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <Input label="Tags" type="text" placeholder="e.g. beach, sunset, funny (comma separated)" bind:value={tagsInput} />

            <div class="pt-4">
                <Button type="submit" class="w-full" {isLoading}>Save Memory</Button>
            </div>
        </form>
    </main>
</MobileShell>

<style>
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    input[type="date"]::-webkit-calendar-picker-indicator {
        background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
    }
</style>