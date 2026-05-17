<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { datePlanService } from '$lib/services/datePlan.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import DatePlanStatusBadge from '$lib/components/date-plans/DatePlanStatusBadge.svelte';
    import DatePlanChecklist from '$lib/components/date-plans/DatePlanChecklist.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import LocationMapPreview from '$lib/components/common/LocationMapPreview.svelte';

    const planId = page.params.id as string;
    const queryClient = useQueryClient();

    let newItemText = $state('');
    let isAdding = $state(false);
    let isConverting = $state(false);

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login' as any));
        else if (!coupleStore.isActive) goto(resolve('/join-couple' as any));
    });

    const planQuery = createQuery(() => ({
        queryKey: ['date-plan', planId],
        queryFn: () => datePlanService.getDatePlanDetail(planId)
    }));

    let plan = $derived(planQuery.data);

    const formatDateClean = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    async function handleAddChecklist(e: SubmitEvent) {
        e.preventDefault();
        if (!newItemText.trim()) return;
        
        isAdding = true;
        try {
            await datePlanService.addChecklistItem(planId, { item: newItemText });
            newItemText = '';
            queryClient.invalidateQueries({ queryKey: ['date-plan', planId] });
        } catch (error) {
            console.error(error);
        } finally {
            isAdding = false;
        }
    }

    async function handleToggleChecklist(checklistId: string, newStatus: boolean) {
        try {
            await datePlanService.updateChecklistItem(planId, checklistId, { is_checked: newStatus });
            queryClient.invalidateQueries({ queryKey: ['date-plan', planId] });
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDeleteChecklist(checklistId: string) {
        try {
            await datePlanService.deleteChecklistItem(planId, checklistId);
            queryClient.invalidateQueries({ queryKey: ['date-plan', planId] });
        } catch (error) {
            console.error(error);
        }
    }

    async function handleMarkAsCompleted() {
        try {
            await datePlanService.updateDatePlanStatus(planId, { status: 'completed' });
            queryClient.invalidateQueries({ queryKey: ['date-plan', planId] });
            queryClient.invalidateQueries({ queryKey: ['date-plans'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        } catch (error) {
            console.error(error);
        }
    }

    async function handleConvertToMemory() {
        isConverting = true;
        try {
            const memoryRes = await datePlanService.convertToMemory(planId);
            
            queryClient.invalidateQueries({ queryKey: ['date-plans'] });
            queryClient.invalidateQueries({ queryKey: ['memories'] });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            
            await goto(resolve(`/memories/${memoryRes.id}` as any));
        } catch (error) {
            console.error(error);
            alert("Failed to convert date to memory.");
        } finally {
            isConverting = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title={plan ? plan.title : 'Loading...'} subtitle={plan ? 'Date Details' : ''} backUrl="/date-plans" />

    <main class="px-6 pt-6 pb-32 space-y-10">
        <!-- INFO SECTION -->
        <section class="relative">
            <div class="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#DDD6FE] opacity-20 blur-3xl pointer-events-none"></div>
            
            {#if planQuery.isPending}
                <div class="space-y-4 mt-4">
                    <div class="h-10 w-3/4 animate-pulse rounded-xl bg-gray-200"></div>
                    <div class="h-6 w-1/2 animate-pulse rounded-lg bg-gray-200"></div>
                </div>
            {:else if plan}
                <div class="pt-2">
                    <div class="flex items-center justify-between mb-4">
                        <DatePlanStatusBadge status={plan.status} class="scale-110 origin-left" />
                    </div>
                    
                    <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">{plan.title}</h1>
                    
                    <div class="space-y-4 mb-6">
                        <div class="flex items-center gap-3 text-gray-600">
                            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/60 shadow-sm border border-white">
                                <svg class="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                            <span class="text-[15px] font-bold">{formatDateClean(plan.plan_date.toString())}</span>
                        </div>
                        
                        {#if plan.location_name && (!plan.latitude || !plan.longitude)}
                            <div class="flex items-center gap-3 text-gray-600">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/60 shadow-sm border border-white">
                                    <svg class="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <span class="text-[15px] font-bold">{plan.location_name}</span>
                            </div>
                        {/if}
                    </div>

                    <!-- MENGGUNAKAN MAP PREVIEW INTERAKTIF -->
                    {#if plan.latitude && plan.longitude}
                        <div class="mb-6">
                            <LocationMapPreview 
                                latitude={plan.latitude} 
                                longitude={plan.longitude} 
                                locationName={plan.location_name} 
                            />
                        </div>
                    {/if}

                    {#if plan.notes}
                        <div class="rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 p-5 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]">
                            <p class="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Notes & Ideas</p>
                            <p class="text-[15px] font-medium text-gray-700 leading-relaxed">{plan.notes}</p>
                        </div>
                    {/if}
                </div>
            {/if}
        </section>

        <!-- CHECKLIST SECTION -->
        <section>
            <div class="mb-5">
                <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Checklist</h2>
                <p class="text-[13px] font-semibold text-gray-400">Things to prepare or do</p>
            </div>

            {#if planQuery.isPending}
                <div class="space-y-3">
                    <div class="h-16 w-full animate-pulse rounded-[24px] bg-white/50 border border-gray-100"></div>
                    <div class="h-16 w-full animate-pulse rounded-[24px] bg-white/50 border border-gray-100"></div>
                </div>
            {:else if plan}
                <div class="space-y-3 mb-5">
                    {#each plan.checklists as item (item.id)}
                        <DatePlanChecklist 
                            id={item.id} 
                            label={item.item} 
                            isChecked={item.is_checked} 
                            onToggle={handleToggleChecklist} 
                            onDelete={handleDeleteChecklist} 
                        />
                    {/each}
                    
                    {#if plan.checklists.length === 0}
                        <div class="rounded-[24px] border border-dashed border-gray-300 py-6 text-center text-sm font-semibold text-gray-400">
                            No checklist items yet.
                        </div>
                    {/if}
                </div>

                <!-- ADD CHECKLIST ITEM FORM -->
                {#if plan.status !== 'completed' && plan.status !== 'cancelled'}
                    <form onsubmit={handleAddChecklist} class="flex items-center gap-3">
                        <div class="flex-1">
                            <Input 
                                type="text" 
                                placeholder="Add a new task..." 
                                bind:value={newItemText} 
                                class="!gap-0"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="md" class="shrink-0 h-14 w-14 !px-0 rounded-2xl bg-white shadow-sm border border-gray-100" isLoading={isAdding}>
                            {#if !isAdding}
                                <svg class="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
                            {/if}
                        </Button>
                    </form>
                {/if}
            {/if}
        </section>

        <!-- ACTION BUTTONS -->
        {#if plan}
            <section class="pt-4 border-t border-gray-200/50">
                {#if plan.status !== 'completed' && plan.status !== 'cancelled'}
                    <Button variant="secondary" class="w-full bg-white text-gray-900 border border-gray-100 shadow-sm hover:shadow-md" onclick={handleMarkAsCompleted}>
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        Mark as Completed
                    </Button>
                {:else if plan.status === 'completed'}
                    <Button class="w-full" onclick={handleConvertToMemory} isLoading={isConverting}>
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        Save as Memory
                    </Button>
                    <p class="text-center text-[12px] font-bold text-gray-400 mt-4 px-4 leading-relaxed">
                        Turn this wonderful plan into a timeless memory to keep forever.
                    </p>
                {/if}
            </section>
        {/if}

    </main>
</MobileShell>