<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { datePlanService } from '$lib/services/datePlan.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import LocationPicker from '$lib/components/common/LocationPicker.svelte';
    import TagsInput from '$lib/components/common/TagsInput.svelte'; // Dipakai untuk Checklist!

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    let title = $state('');
    let plan_date = $state(''); // Datetime-local
    let notes = $state('');
    
    // Mengakomodasi State Location & Checklist Reusable
    let location_name = $state('');
    let latitude = $state<number | undefined>(undefined);
    let longitude = $state<number | undefined>(undefined);
    let checklists = $state<string[]>([]);
    
    let isLoading = $state(false);
    let errorMessage = $state('');

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            if (!plan_date) throw new Error("Please select date and time.");

            const isoDate = new Date(plan_date).toISOString();

            await datePlanService.createDatePlan({ 
                title, 
                plan_date: isoDate, 
                location_name, 
                latitude,
                longitude,
                notes, 
                checklists 
            });
            
            await goto(resolve('/date-plans' as any));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to save date plan.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title="Plan a Date" backUrl="/date-plans" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50/80 backdrop-blur-md p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-6">
            <Input label="Date Title" type="text" placeholder="e.g. Anniversary Dinner" bind:value={title} required />
            
            <Input label="When?" type="datetime-local" bind:value={plan_date} required />
            
            <!-- LOCATION PICKER -->
            <LocationPicker 
                bind:locationName={location_name} 
                bind:latitude={latitude} 
                bind:longitude={longitude} 
            />

            <Textarea 
                label="Notes / Ideas" 
                id="notes"
                bind:value={notes} 
                rows={3} 
                placeholder="Any surprise plans or dress code?"
            />

            <!-- MENGGUNAKAN TAGS INPUT UNTUK CHECKLIST (karena logic-nya identik: string array) -->
            <TagsInput 
                label="Checklists"
                bind:tags={checklists} 
            />

            <div class="pt-6">
                <Button type="submit" class="w-full" {isLoading}>Create Date Plan</Button>
            </div>
        </form>
    </main>
</MobileShell>

<style>
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
    }
</style>