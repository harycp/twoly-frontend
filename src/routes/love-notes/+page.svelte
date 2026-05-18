<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { loveNoteService } from '$lib/services/loveNote.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Tabs from '$lib/components/common/Tabs.svelte';
    import DeleteButton from '$lib/components/common/DeleteButton.svelte';

    const queryClient = useQueryClient();

    onMount(() => {
        if (!authStore.isAuthenticated) goto(resolve('/login'));
        else if (!coupleStore.isActive) goto(resolve('/join-couple'));
    });

    let currentTab = $state('received'); // 'received' | 'sent'
    let myId = $derived(authStore.user?.id);
    let openingNoteId = $state<string | null>(null);

    const notesQuery = createQuery(() => ({
        queryKey: ['love-notes'],
        queryFn: () => loveNoteService.getLoveNotes()
    }));

    let allNotes = $derived(notesQuery.data || []);
    
    let receivedNotes = $derived(allNotes.filter(n => n.receiver_id === myId));
    let sentNotes = $derived(allNotes.filter(n => n.sender_id === myId));

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const isLocked = (unlockAt: string | null | undefined) => {
        if (!unlockAt) return false;
        return new Date(unlockAt).getTime() > new Date().getTime();
    };

    async function handleOpenNote(noteId: string) {
        openingNoteId = noteId;
        try {
            await loveNoteService.openLoveNote(noteId);
            queryClient.invalidateQueries({ queryKey: ['love-notes'] });
        } catch (error) {
            console.error(error);
            alert("Failed to open the note. Maybe it's not time yet!");
        } finally {
            openingNoteId = null;
        }
    }

    async function handleDeleteNote(noteId: string) {
        try {
            await loveNoteService.deleteLoveNote(noteId);
            queryClient.invalidateQueries({ queryKey: ['love-notes'] });
        } catch (error) {
            console.error(error);
        }
    }
</script>

<MobileShell>
    <!-- HEADER PINTAR -->
    <PageHeader title="Love Notes" subtitle="Secret messages for you" backUrl="/dashboard">
        {#snippet rightContent()}
            <a aria-label="Write a note" href={resolve('/love-notes/new')} class="group flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition-all duration-300 active:scale-90 hover:bg-gray-800">
                <svg class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            </a>
        {/snippet}
    </PageHeader>

    <main class="px-6 pt-6 pb-32 space-y-6">
        <Tabs 
            items={[ 
                { value: 'received', label: 'Received' }, 
                { value: 'sent', label: 'Sent' }
            ]} 
            activeValue={currentTab} 
            onChange={(val) => currentTab = val} 
        />

        {#if notesQuery.isPending}
            <div class="space-y-4 pt-2">
                <div class="animate-pulse h-24 w-full rounded-[24px] bg-white/50 border border-gray-100"></div>
                <div class="animate-pulse h-24 w-full rounded-[24px] bg-white/50 border border-gray-100"></div>
            </div>
        {:else}
            <!-- DAFTAR PESAN DITERIMA -->
            {#if currentTab === 'received'}
                {#if receivedNotes.length === 0}
                    <div class="flex flex-col items-center justify-center py-16 px-6 text-center opacity-80">
                        <div class="h-16 w-16 mb-4 rounded-[20px] bg-[#F8B4C8]/20 flex items-center justify-center text-[#FDA4AF] rotate-[-6deg]">
                            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5"/></svg>
                        </div>
                        <h3 class="text-lg font-black text-gray-900 tracking-tight">Mailbox Empty</h3>
                        <p class="text-sm font-medium text-gray-500 mt-1">You haven't received any secret notes yet.</p>
                    </div>
                {:else}
                    <div class="space-y-4 pt-2">
                        {#each receivedNotes as note (note.id)}
                            {@const locked = isLocked(note.unlock_at?.toString())}
                            
                            <div class="relative overflow-hidden rounded-[28px] p-5 shadow-sm border transition-all duration-300 {note.is_opened ? 'bg-white/60 backdrop-blur-xl border-white hover:bg-white/80' : 'bg-gradient-to-br from-[#FDA4AF] to-[#F8B4C8] border-transparent text-white shadow-[0_8px_20px_-6px_rgba(253,164,175,0.4)]'}">
                                
                                <div class="flex items-start justify-between gap-4 mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="flex h-8 w-8 items-center justify-center rounded-full {note.is_opened ? 'bg-[#F8B4C8]/20 text-[#FDA4AF]' : 'bg-white/20 text-white'}">
                                            {#if note.is_opened}
                                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5M10 12l2.25 1.5M14 12l-2.25 1.5"/></svg>
                                            {:else}
                                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                            {/if}
                                        </div>
                                        <span class="text-[11px] font-black uppercase tracking-widest {note.is_opened ? 'text-gray-400' : 'text-white/80'}">
                                            {note.is_opened ? 'Opened' : locked ? 'Locked' : 'Ready to open'}
                                        </span>
                                    </div>
                                    <span class="text-[10px] font-bold opacity-70">
                                        {formatDate(note.created_at.toString())}
                                    </span>
                                </div>

                                {#if note.is_opened}
                                    <p class="text-[15px] font-medium text-gray-800 leading-relaxed font-handwritten text-xl">{note.message}</p>
                                {:else}
                                    <div class="flex items-center justify-between mt-4">
                                        <p class="text-sm font-bold text-white/90">A secret message for you...</p>
                                        {#if locked && note.unlock_at}
                                            <div class="px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white">
                                                Opens {formatDate(note.unlock_at.toString())}
                                            </div>
                                        {:else}
                                            <button 
                                                onclick={() => handleOpenNote(note.id)}
                                                disabled={openingNoteId === note.id}
                                                class="px-4 py-2 rounded-full bg-white text-[#FDA4AF] text-[11px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {openingNoteId === note.id ? 'Opening...' : 'Open Now'}
                                            </button>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}

            <!-- DAFTAR PESAN TERKIRIM -->
            {#if currentTab === 'sent'}
                {#if sentNotes.length === 0}
                    <div class="flex flex-col items-center justify-center py-16 px-6 text-center opacity-80">
                        <p class="text-sm font-medium text-gray-500 mt-1">You haven't sent any notes yet.</p>
                    </div>
                {:else}
                    <div class="space-y-4 pt-2">
                        {#each sentNotes as note (note.id)}
                            <div class="relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-xl p-5 shadow-sm border border-white/60">
                                <div class="flex items-start justify-between mb-2">
                                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Status: <span class={note.is_opened ? 'text-green-500' : 'text-orange-400'}>{note.is_opened ? 'Read' : 'Unread'}</span>
                                    </span>
                                    <span class="text-[10px] font-bold text-gray-400">{formatDate(note.created_at.toString())}</span>
                                </div>
                                <p class="text-[14px] font-medium text-gray-600 leading-relaxed mb-4 line-clamp-2 italic">"{note.message}"</p>
                                
                                <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                                    {#if note.unlock_at}
                                        <span class="text-[10px] font-bold text-gray-400">Locked until: {formatDate(note.unlock_at.toString())}</span>
                                    {:else}
                                        <span></span>
                                    {/if}
                                    <DeleteButton 
                                        label="" 
                                        class="!h-8 !w-8 !p-0 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                        onDelete={() => handleDeleteNote(note.id)} 
                                    />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </main>
</MobileShell>