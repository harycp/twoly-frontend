<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { authService } from '$lib/services/auth.service';
    import { coupleService } from '$lib/services/couple.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import AlertDialog from '$lib/components/common/AlertDialog.svelte';
    import DeleteButton from '$lib/components/common/DeleteButton.svelte';

    const queryClient = useQueryClient();

    let name = $state('');
    let username = $state('');
    let avatarUrl = $state('');
    
    let fileInput: HTMLInputElement | null = null;
    let avatarFile = $state<File | null>(null);
    let localAvatarPreview = $state<string | null>(null);
    let isSavingProfile = $state(false);

    let anniversaryDate = $state('');
    let isSavingCouple = $state(false);

    let isLoggingOut = $state(false);
    let alertState = $state({ isOpen: false, title: '', message: '' });
    
    let partnerName = $derived(coupleStore.partner?.name || 'Waiting for partner...');
    let myInitials = $derived(authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : '?');

    onMount(() => {
        if (!authStore.isAuthenticated) {
            goto(resolve('/login'));
            return;
        }

        name = authStore.user?.name || '';
        username = authStore.user?.username || '';
        avatarUrl = authStore.user?.avatar_url || '';
        
        if (coupleStore.data?.anniversary_date) {
            anniversaryDate = coupleStore.data.anniversary_date.split('T')[0];
        }
    });

    function handleAvatarSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            avatarFile = input.files[0];
            localAvatarPreview = URL.createObjectURL(avatarFile); 
        }
    }

    async function handleSaveProfile(e: SubmitEvent) {
        e.preventDefault();
        isSavingProfile = true;
        try {
            await authService.updateProfile({ 
                name, 
                username,
                avatar: avatarFile || undefined
            });
            
            avatarFile = null;
            localAvatarPreview = null;
            avatarUrl = authStore.user?.avatar_url || ''; 
            
            alertState = { isOpen: true, title: 'Success', message: 'Your profile has been updated!' };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            alertState = { isOpen: true, title: 'Error', message: msg || 'Failed to update profile.' };
        } finally {
            isSavingProfile = false;
        }
    }

    async function handleSaveCouple(e: SubmitEvent) {
        e.preventDefault();
        isSavingCouple = true;
        try {
            await coupleService.updateCoupleSettings({ 
                anniversary_date: anniversaryDate || undefined 
            });
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            
            alertState = { isOpen: true, title: 'Success', message: 'Couple space settings updated!' };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            alertState = { isOpen: true, title: 'Error', message: msg || 'Failed to update settings.' };
        } finally {
            isSavingCouple = false;
        }
    }

    async function handleLogout() {
        isLoggingOut = true;
        await new Promise(r => setTimeout(r, 800)); 
        authService.logout();
        coupleStore.clear(); 
        queryClient.clear(); 
        goto(resolve('/login'));
    }

    function copyInviteCode() {
        if (coupleStore.data?.invite_code) {
            navigator.clipboard.writeText(coupleStore.data.invite_code).then(() => {
                alertState = { isOpen: true, title: 'Copied!', message: 'Invite code saved to clipboard.' };
            }).catch(() => {
                document.execCommand('copy');
                alertState = { isOpen: true, title: 'Copied!', message: 'Invite code saved.' };
            });
        }
    }
</script>

<MobileShell>
    <PageHeader title="Settings" subtitle="Manage your account & space" />

    <main class="px-6 pt-6 pb-32 space-y-10">
        
        <!-- AVATAR HEADER PREMIUM (Kini menjadi tombol upload file yang interaktif) -->
        <div class="flex flex-col items-center justify-center pt-4 pb-2">
            <button 
                type="button"
                onclick={() => fileInput?.click()}
                class="relative group outline-none text-left"
                aria-label="Change Profile Picture"
            >
                <!-- File Input Tersembunyi -->
                <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    class="hidden" 
                    bind:this={fileInput} 
                    onchange={handleAvatarSelect} 
                />

                {#if localAvatarPreview || avatarUrl}
                    <div class="relative h-28 w-28 rounded-[36px] bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] rotate-3 transition-transform duration-500 group-hover:rotate-0 border-[3px] border-white overflow-hidden p-1">
                        <img src={localAvatarPreview || avatarUrl} alt="Avatar" class="h-full w-full object-cover rounded-[28px]" />
                        <!-- Hover Overlay Effect -->
                        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[28px] m-1 backdrop-blur-[2px]">
                            <svg class="h-7 w-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>
                {:else}
                    <div class="relative flex h-28 w-28 items-center justify-center rounded-[36px] bg-gradient-to-br from-[#FDA4AF] to-[#F8B4C8] text-5xl font-black text-white shadow-[0_12px_40px_-12px_rgba(253,164,175,0.6)] border-[3px] border-white rotate-3 transition-transform duration-500 group-hover:rotate-0 p-1">
                        <div class="flex h-full w-full items-center justify-center rounded-[28px] border-2 border-white/20">
                            {myInitials}
                        </div>
                        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[28px] m-1 backdrop-blur-[1px]">
                            <svg class="h-7 w-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>
                {/if}
                
                <!-- Badge Pensil yang menonjol -->
                <div class="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg border-2 border-white transition-transform group-active:scale-90 pointer-events-none">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </div>
            </button>

            <h2 class="mt-6 text-2xl font-black text-gray-900 tracking-tight leading-none">{authStore.user?.name}</h2>
            <p class="text-sm font-bold text-gray-400 mt-1">@{authStore.user?.username}</p>
        </div>

        <!-- FORM 1: PERSONAL PROFILE -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.08)] border border-white/80">
            <div class="mb-6 flex items-center gap-3 border-b border-gray-100/50 pb-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gray-100/80 text-gray-600">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Your Profile</h3>
            </div>
            
            <form onsubmit={handleSaveProfile} class="space-y-5">
                <Input label="Full Name" type="text" bind:value={name} required />
                <Input label="Username" type="text" bind:value={username} required />
                
                <div class="pt-3">
                    <Button type="submit" variant="secondary" size="md" class="w-full shadow-sm hover:shadow-md transition-all border-gray-100" isLoading={isSavingProfile}>
                        Save Profile
                    </Button>
                </div>
            </form>
        </section>

        <!-- FORM 2: COUPLE SPACE -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(253,164,175,0.2)] border border-white/80 relative overflow-hidden">
            <!-- Decorative Elegant Glow -->
            <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FDA4AF] opacity-10 blur-3xl pointer-events-none"></div>
            
            <div class="mb-6 flex items-center gap-3 border-b border-[#FDA4AF]/10 pb-4 relative z-10">
                <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FDA4AF]/10 text-[#FDA4AF]">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Couple Space</h3>
            </div>

            <!-- Linked Partner Info -->
            <div class="mb-6 flex items-center gap-4 rounded-[24px] bg-white/50 border border-white p-4 shadow-sm relative z-10">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#F8B4C8]/20 text-[#FDA4AF] font-black text-xl border border-white">
                    {partnerName.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Linked Partner</p>
                    <p class="text-base font-black text-gray-900 truncate">{partnerName}</p>
                </div>
            </div>

            <form onsubmit={handleSaveCouple} class="space-y-5 relative z-10">
                <Input label="Anniversary Date" type="date" bind:value={anniversaryDate} />
                
                <div class="flex flex-col gap-2 w-full pt-1">
                    <p class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Invite Code</p>
                    <div class="flex gap-2">
                        <div class="flex-1 flex items-center h-14 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl px-5 text-base font-black text-gray-900 tracking-[0.15em] shadow-inner">
                            {coupleStore.data?.invite_code || '------'}
                        </div>
                        <Button type="button" variant="secondary" size="md" class="shrink-0 !px-4 h-14 bg-white shadow-sm border-white" onclick={copyInviteCode}>
                            <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </Button>
                    </div>
                </div>

                <div class="pt-4">
                    <Button type="submit" size="md" class="w-full shadow-md" isLoading={isSavingCouple}>
                        Save Space Settings
                    </Button>
                </div>
            </form>
        </section>

        <!-- DANGER ZONE -->
        <section class="pt-6 px-2">
            <DeleteButton 
                label="Log Out of Twoly"
                dialogTitle="Log Out"
                dialogMessage="Are you sure you want to log out from this device? You can log back in anytime."
                onDelete={handleLogout}
            />
            {#if isLoggingOut}
                <p class="text-center text-[12px] text-gray-500 mt-3">Logging out...</p>
            {/if}
            <p class="text-center text-[11px] font-bold text-gray-400 mt-6 tracking-widest">
                TWOLY BETA V1.0.0
            </p>
        </section>

    </main>
</MobileShell>

<AlertDialog 
    bind:isOpen={alertState.isOpen} 
    title={alertState.title} 
    message={alertState.message} 
/>