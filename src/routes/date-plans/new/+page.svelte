<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { datePlanService } from '$lib/services/datePlan.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import LocationPicker from '$lib/components/common/LocationPicker.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import DateTimePicker from '$lib/components/common/DateTimePicker.svelte'; // <-- Komponen baru

    let title = $state('');
    let planDate = $state('');
    let locationName = $state('');
    let latitude = $state<number | undefined>(undefined);
    let longitude = $state<number | undefined>(undefined);
    let notes = $state('');
    let checklists = $state<string[]>([]);
    let newChecklist = $state('');

    let isLoading = $state(false);
    let errorMessage = $state('');

    const queryClient = useQueryClient();

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    function addChecklist(e: Event) {
        e.preventDefault();
        if (newChecklist.trim()) {
            checklists = [...checklists, newChecklist.trim()];
            newChecklist = '';
        }
    }

    function removeChecklist(index: number) {
        checklists = checklists.filter((_, i) => i !== index);
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            const isoDate = new Date(planDate).toISOString();
            await datePlanService.createDatePlan({ 
                title, 
                plan_date: isoDate, 
                location_name: locationName, 
                latitude,
                longitude,
                notes, 
                checklists 
            });
            
            // Invalidate cache global agar list plans dan kalender langsung update
            queryClient.invalidateQueries({ queryKey: ['date-plans'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            
            await goto(resolve('/date-plans'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to create date plan.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title="New Plan" subtitle="Design your next memories" backUrl="/date-plans" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-6">
            <Input label="Date Title" type="text" placeholder="e.g. Anniversary Dinner" bind:value={title} required />
            
            <!-- MENGGUNAKAN DATETIME PICKER CANGGIH -->
            <DateTimePicker label="When?" type="datetime-local" bind:value={planDate} required />
            
            <!-- Smart Location Picker -->
            <LocationPicker 
                bind:locationName={locationName} 
                bind:latitude={latitude} 
                bind:longitude={longitude} 
            />

            <Textarea 
                label="Notes / Ideas" 
                bind:value={notes} 
                rows={3} 
                placeholder="Any surprise plans or dress code?"
            />

            <div class="space-y-2 pt-2 border-t border-white">
                <div class="flex gap-2">
                    <Input
                        id="newChecklist"
                        label="Initial Checklist"
                        type="text"
                        placeholder="Add item..."
                        bind:value={newChecklist}
                        onkeydown={(e) => e.key === 'Enter' && addChecklist(e)}
                        class="flex-1"
                    />
                    <Button type="button" variant="secondary" class="shrink-0 px-4! shadow-sm" onclick={addChecklist}>
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    </Button>
                </div>
                
                {#if checklists.length > 0}
                    <ul class="mt-4 space-y-2">
                        {#each checklists as item, index (index)}
                            <li class="flex items-center justify-between rounded-xl bg-white/40 backdrop-blur-xl border border-white/60 p-3 shadow-sm transition-all hover:bg-white/60">
                                <span class="text-sm font-bold text-gray-700">{item}</span>
                                <button type="button" aria-label={`Remove checklist item ${item}`} onclick={() => removeChecklist(index)} class="text-gray-400 hover:text-red-500 transition-colors">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>

            <div class="pt-6 border-t border-white">
                <Button type="submit" class="w-full shadow-lg" {isLoading}>Create Date Plan</Button>
            </div>
        </form>
    </main>
</MobileShell>