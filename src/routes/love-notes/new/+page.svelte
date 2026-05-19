<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { loveNoteService } from '$lib/services/loveNote.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Textarea from '$lib/components/common/Textarea.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import Toggle from '$lib/components/common/Toggle.svelte';
    import DateTimePicker from '$lib/components/common/DateTimePicker.svelte';

    const queryClient = useQueryClient();

    let message = $state('');
    let enableLock = $state(false);
    let unlockAt = $state('');
    
    let isLoading = $state(false);
    let errorMessage = $state('');

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            let finalUnlockAt: string | undefined = undefined;
            if (enableLock && unlockAt) {
                const d = new Date(unlockAt);
                finalUnlockAt = d.toISOString();
            }

            await loveNoteService.createLoveNote({
                message,
                unlock_at: finalUnlockAt
            });
            
            queryClient.invalidateQueries({ queryKey: ['love-notes'] });
            await goto(resolve('/love-notes'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to send love note.';
        } finally {
            isLoading = false;
        }
    }
</script>

<MobileShell>
    <PageHeader title="Write a Note" subtitle="Send a secret message" backUrl="/love-notes" />

    <main class="px-6 pt-6 pb-32">
        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-6">
            
            <div class="relative group">
                <div class="absolute -right-2 -top-5 text-4xl opacity-30 rotate-12 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">💌</div>
                <Textarea 
                    label="Your Message" 
                    bind:value={message} 
                    placeholder="Write something sweet, a confession, or a future wish..." 
                    rows={6} 
                    required 
                    class="font-handwritten text-xl tracking-wide leading-relaxed shadow-sm"
                />
            </div>

            <!-- KARTU TIME CAPSULE YANG DISEMPURNAKAN -->
            <div class="rounded-[28px] bg-white/60 backdrop-blur-2xl border border-white p-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] transition-all duration-300 {enableLock ? 'ring-2 ring-[#FDA4AF]/20' : ''}">
                <div class="flex items-center justify-between {enableLock ? 'mb-4 pb-4 border-b border-gray-100' : ''} transition-all duration-300">
                    <div class="pr-4">
                        <h4 class="text-[13px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                            <svg class="h-4 w-4 text-[#FDA4AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            Time Capsule Lock
                        </h4>
                        <p class="text-[11px] font-bold text-gray-400 mt-1 leading-snug">Lock this message until a specific date and time.</p>
                    </div>
                    
                    <Toggle bind:checked={enableLock} size="md" />
                </div>

                {#if enableLock}
                    <div class="animate-in slide-in-from-top-2 fade-in duration-300 ease-out">
                        <!-- MENGGUNAKAN KOMPONEN BARU -->
                        <DateTimePicker 
                            type="datetime-local" 
                            label="Unlock At" 
                            bind:value={unlockAt} 
                            required={enableLock} 
                        />
                        <p class="text-[10px] font-bold text-[#FDA4AF] mt-3 text-center uppercase tracking-widest">
                            The recipient won't be able to read this until the selected time.
                        </p>
                    </div>
                {/if}
            </div>

            <div class="pt-6">
                <Button type="submit" class="w-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" {isLoading}>
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    Seal & Send Note
                </Button>
            </div>
        </form>
    </main>
</MobileShell>

<style>
    /* Mengimpor font tulisan tangan estetik khusus form surat cinta ini */
    :global(.font-handwritten textarea) { 
        font-family: 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive !important; 
    }
</style>