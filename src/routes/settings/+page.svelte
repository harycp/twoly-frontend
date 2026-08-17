<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { useQueryClient } from '@tanstack/svelte-query';
    
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import { authService } from '$lib/services/auth.service';
    import { coupleService } from '$lib/services/couple.service';
    import { gdriveService } from '$lib/services/gdrive.service';
    
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import PageHeader from '$lib/components/layout/PageHeader.svelte';
    import Input from '$lib/components/common/Input.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import AlertDialog from '$lib/components/common/AlertDialog.svelte';
    import DeleteButton from '$lib/components/common/DeleteButton.svelte';

    const queryClient = useQueryClient();

    // State Form Profil
    let name = $state('');
    let username = $state('');
    let avatarUrl = $state('');
    
    // State Khusus File Upload (Avatar)
    let fileInput: HTMLInputElement;
    let localAvatarPreview = $state<string | null>(null);
    let isSavingProfile = $state(false);
    let isUploadingAvatar = $state(false);

    // State Form Couple
    let anniversaryDate = $state('');
    let isSavingCouple = $state(false);

    // State Form Google Drive
    let gdriveFolderUrl = $state('');
    let storageProvider = $state<'cloudinary' | 'gdrive'>('cloudinary');
    let serviceAccountEmail = $state('');
    let verifiedFolderName = $state('');
    let isVerifyingDrive = $state(false);
    let isSavingGDrive = $state(false);
    let isConnectingOAuth = $state(false);
    let isDisconnectingDrive = $state(false);
    let showPermissionsHelp = $state(false);

    // State Global & Alert
    let alertState = $state({ isOpen: false, title: '', message: '' });
    
    let partnerName = $derived(coupleStore.partner?.name || 'Waiting for partner...');
    let myInitials = $derived(authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : '?');
    let isOAuthConnected = $derived(Boolean(coupleStore.data?.gdrive_connected));
    let isDriveConnected = $derived(Boolean(coupleStore.data?.gdrive_folder_id || (gdriveFolderUrl.trim() && verifiedFolderName)));

    onMount(async () => {
        if (!authStore.isAuthenticated) {
            void goto(resolve('/login'));
            return;
        }

        // Handle OAuth redirect query params
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const gdriveStatus = urlParams.get('gdrive');
            if (gdriveStatus === 'connected') {
                alertState = {
                    isOpen: true,
                    title: 'Google Drive Linked! 🎉',
                    message: 'Your Google Drive account has been connected successfully. Uploads will now use your Google storage!'
                };
                window.history.replaceState({}, '', window.location.pathname);
                await coupleService.getMyCouple();
            } else if (gdriveStatus === 'error') {
                const errMsg = urlParams.get('message') || 'Failed to connect Google Drive.';
                alertState = {
                    isOpen: true,
                    title: 'Connection Failed',
                    message: `Google Drive connection error: ${errMsg}`
                };
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        name = authStore.user?.name || '';
        username = authStore.user?.username || '';
        
        // CACHE-BUSTER: Tambahkan timestamp agar browser selalu mengambil foto paling baru dari server!
        if (authStore.user?.avatar_url) {
            avatarUrl = `${authStore.user.avatar_url}?v=${new Date().getTime()}`;
        }
        
        if (coupleStore.data?.anniversary_date) {
            anniversaryDate = coupleStore.data.anniversary_date.split('T')[0];
        }

        if (coupleStore.data?.gdrive_folder_url) {
            gdriveFolderUrl = coupleStore.data.gdrive_folder_url;
        }

        if (coupleStore.data?.storage_provider) {
            storageProvider = coupleStore.data.storage_provider;
        }

        try {
            const config = await gdriveService.getConfig();
            if (config.service_account_email) {
                serviceAccountEmail = config.service_account_email;
            }
        } catch {
            // silent ignore
        }
    });

    // === FITUR OAUTH CONNECT GOOGLE DRIVE ===
    async function handleConnectOAuth() {
        isConnectingOAuth = true;
        try {
            const res = await gdriveService.getAuthUrl();
            if (res.auth_url) {
                window.location.href = res.auth_url;
            } else {
                throw new Error('No authorization URL received.');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to start Google connection.';
            alertState = { isOpen: true, title: 'Connection Failed', message };
            isConnectingOAuth = false;
        }
    }

    // === FITUR DISCONNECT GOOGLE DRIVE ===
    async function handleDisconnectGDrive() {
        isDisconnectingDrive = true;
        try {
            await gdriveService.disconnect();
            await coupleService.getMyCouple();
            storageProvider = 'cloudinary';
            alertState = { isOpen: true, title: 'Disconnected', message: 'Google Drive has been disconnected. Storage provider switched to Cloudinary.' };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to disconnect Google Drive.';
            alertState = { isOpen: true, title: 'Error', message };
        } finally {
            isDisconnectingDrive = false;
        }
    }

    // === FITUR TEST GOOGLE DRIVE FOLDER LINK ===
    async function handleVerifyGDrive() {
        if (!gdriveFolderUrl.trim()) {
            alertState = { isOpen: true, title: 'Input Required', message: 'Please enter a Google Drive folder link first.' };
            return;
        }

        isVerifyingDrive = true;
        try {
            const res = await gdriveService.verifyFolder(gdriveFolderUrl);
            verifiedFolderName = res.folder_name;
            if (res.service_account_email) {
                serviceAccountEmail = res.service_account_email;
            }
            alertState = { isOpen: true, title: 'Verified! 🎉', message: `Folder "${res.folder_name}" is verified and accessible!` };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to verify folder.';
            alertState = { isOpen: true, title: 'Verification Failed', message };
        } finally {
            isVerifyingDrive = false;
        }
    }

    // === FITUR SIMPAN PENGATURAN GOOGLE DRIVE ===
    async function handleSaveGDrive(e: SubmitEvent) {
        e.preventDefault();
        isSavingGDrive = true;
        try {
            await coupleService.updateCoupleSettings({
                gdrive_folder_url: gdriveFolderUrl.trim() || undefined,
                storage_provider: storageProvider
            });
            await coupleService.getMyCouple();
            alertState = { isOpen: true, title: 'Settings Saved! 🚀', message: 'Storage settings have been saved successfully!' };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save Google Drive settings.';
            alertState = { isOpen: true, title: 'Error', message };
        } finally {
            isSavingGDrive = false;
        }
    }

    function copyServiceAccountEmail() {
        if (serviceAccountEmail) {
            navigator.clipboard.writeText(serviceAccountEmail).then(() => {
                alertState = { isOpen: true, title: 'Copied!', message: 'Service account email copied to clipboard.' };
            }).catch(() => {
                document.execCommand('copy');
                alertState = { isOpen: true, title: 'Copied!', message: 'Service account email copied.' };
            });
        }
    }

    // === FITUR AUTO-UPLOAD AVATAR ===
    async function handleAvatarSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        localAvatarPreview = URL.createObjectURL(file); 
        isUploadingAvatar = true;

        try {
            // Upload langsung ke server sekejap setelah dipilih
            await authService.updateProfile({ 
                name, 
                username,
                avatar: file 
            });
            
            // Perbarui URL dengan Cache-Buster baru agar langsung terganti di layar
            avatarUrl = authStore.user?.avatar_url ? `${authStore.user.avatar_url}?v=${new Date().getTime()}` : '';
            alertState = { isOpen: true, title: 'Success', message: 'Profile picture updated perfectly!' };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to upload photo.';
            alertState = { isOpen: true, title: 'Upload Failed', message };
            localAvatarPreview = null; 
        } finally {
            isUploadingAvatar = false;
            if (fileInput) fileInput.value = '';
        }
    }

    // === FITUR SIMPAN DATA TEKS (NAMA & USERNAME) ===
    async function handleSaveProfile(e: SubmitEvent) {
        e.preventDefault();
        isSavingProfile = true;
        try {
            await authService.updateProfile({ name, username });
            alertState = { isOpen: true, title: 'Success', message: 'Your profile details have been saved!' };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update profile.';
            alertState = { isOpen: true, title: 'Error', message };
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
            const message = error instanceof Error ? error.message : 'Failed to update settings.';
            alertState = { isOpen: true, title: 'Error', message };
        } finally {
            isSavingCouple = false;
        }
    }

    async function handleLogout() {
        await new Promise(r => setTimeout(r, 800)); 
        authService.logout();
        coupleStore.clear(); 
        queryClient.clear(); 
        void goto(resolve('/login'));
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
        
        <!-- AVATAR HEADER PREMIUM -->
        <div class="flex flex-col items-center justify-center pt-4 pb-2">
            <button 
                type="button"
                onclick={() => fileInput.click()}
                disabled={isUploadingAvatar}
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
                        
                        <!-- Overlay Loading Spinner saat proses upload -->
                        {#if isUploadingAvatar}
                            <div class="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-[28px] m-1 backdrop-blur-[2px]">
                                <svg class="h-8 w-8 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        {/if}

                        <!-- Hover Overlay Effect -->
                        {#if !isUploadingAvatar}
                            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[28px] m-1 backdrop-blur-[2px]">
                                <svg class="h-7 w-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="relative flex h-28 w-28 items-center justify-center rounded-[36px] bg-linear-to-br from-[#FDA4AF] to-[#F8B4C8] text-5xl font-black text-white shadow-[0_12px_40px_-12px_rgba(253,164,175,0.6)] border-[3px] border-white rotate-3 transition-transform duration-500 group-hover:rotate-0 p-1">
                        <div class="flex h-full w-full items-center justify-center rounded-[28px] border-2 border-white/20">
                            {#if isUploadingAvatar}
                                <svg class="h-8 w-8 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {:else}
                                {myInitials}
                            {/if}
                        </div>
                        {#if !isUploadingAvatar}
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[28px] m-1 backdrop-blur-[1px]">
                                <svg class="h-7 w-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                {#if !isUploadingAvatar}
                    <div class="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg border-2 border-white transition-transform group-active:scale-90 pointer-events-none">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </div>
                {/if}
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
            
            <!-- Ditambahkan autocomplete="off" untuk meredam error dari ekstensi Password Manager -->
            <form onsubmit={handleSaveProfile} autocomplete="off" class="space-y-5">
                <Input label="Full Name" type="text" bind:value={name} autocomplete="off" required />
                <Input label="Username" type="text" bind:value={username} autocomplete="off" required />
                
                <div class="pt-3">
                    <Button type="submit" variant="secondary" size="md" class="w-full shadow-sm hover:shadow-md transition-all border-gray-100" isLoading={isSavingProfile}>
                        Save Details
                    </Button>
                </div>
            </form>
        </section>

        <!-- FORM 2: COUPLE SPACE -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(253,164,175,0.2)] border border-white/80 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FDA4AF] opacity-10 blur-3xl pointer-events-none"></div>
            
            <div class="mb-6 flex items-center gap-3 border-b border-[#FDA4AF]/10 pb-4 relative z-10">
                <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FDA4AF]/10 text-[#FDA4AF]">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Couple Space</h3>
            </div>

            <!-- Linked Partner Info -->
            <div class="mb-6 flex items-center gap-4 rounded-3xl bg-white/50 border border-white p-4 shadow-sm relative z-10">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8B4C8]/20 text-[#FDA4AF] font-black text-xl border border-white overflow-hidden">
                    {#if coupleStore.partner?.avatar_url}
                        <img src="{coupleStore.partner.avatar_url}?v={new Date().getTime()}" alt={partnerName} class="h-full w-full object-cover" />
                    {:else}
                        {partnerName.charAt(0).toUpperCase()}
                    {/if}
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Linked Partner</p>
                    <p class="text-base font-black text-gray-900 truncate">{partnerName}</p>
                </div>
            </div>

            <form onsubmit={handleSaveCouple} class="space-y-5 relative z-10">
                <Input label="Anniversary Date" type="date" bind:value={anniversaryDate} />
                
                <div class="flex flex-col gap-2 w-full pt-1">
                    <span class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Invite Code</span>
                    <div class="flex gap-2">
                        <div class="flex-1 flex items-center h-14 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl px-5 text-base font-black text-gray-900 tracking-[0.15em] shadow-inner">
                            {coupleStore.data?.invite_code || '------'}
                        </div>
                        <Button type="button" variant="secondary" size="md" class="shrink-0 px-4! h-14 bg-white shadow-sm border-white" onclick={copyInviteCode}>
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

        <!-- FORM 3: MEDIA STORAGE -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.08)] border border-white/80">
            <!-- Section Header -->
            <div class="mb-6 flex items-center justify-between border-b border-gray-100/60 pb-4">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gray-100/80 text-gray-600">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Media Storage</h3>
                        <p class="text-xs text-gray-400 font-medium">Manage where couple photos & videos are stored</p>
                    </div>
                </div>

                {#if storageProvider === 'gdrive' && isOAuthConnected}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Active
                    </span>
                {/if}
            </div>

            <form onsubmit={handleSaveGDrive} class="space-y-6">
                <!-- Storage Provider Selection Cards -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Google Drive Option -->
                    <button
                        type="button"
                        onclick={() => storageProvider = 'gdrive'}
                        class="relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between {storageProvider === 'gdrive' ? 'bg-white border-[#FDA4AF] shadow-[0_4px_20px_-4px_rgba(253,164,175,0.25)] ring-1 ring-[#FDA4AF]' : 'bg-white/40 border-gray-100 hover:bg-white/70 text-gray-400'}"
                    >
                        <div class="flex items-center justify-between w-full mb-3">
                            <div class="h-8 w-8 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center">
                                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                            </div>
                            <div class="h-4 w-4 rounded-full border flex items-center justify-center {storageProvider === 'gdrive' ? 'border-[#FDA4AF] bg-[#FDA4AF]' : 'border-gray-300'}">
                                {#if storageProvider === 'gdrive'}
                                    <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                                {/if}
                            </div>
                        </div>
                        <div>
                            <p class="text-[13px] font-black {storageProvider === 'gdrive' ? 'text-gray-900' : 'text-gray-600'}">Google Drive</p>
                            <p class="text-[10.5px] text-gray-400 font-medium leading-tight mt-0.5">Original quality & auto-folders</p>
                        </div>
                    </button>

                    <!-- Cloudinary Option -->
                    <button
                        type="button"
                        onclick={() => storageProvider = 'cloudinary'}
                        class="relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between {storageProvider === 'cloudinary' ? 'bg-white border-[#FDA4AF] shadow-[0_4px_20px_-4px_rgba(253,164,175,0.25)] ring-1 ring-[#FDA4AF]' : 'bg-white/40 border-gray-100 hover:bg-white/70 text-gray-400'}"
                    >
                        <div class="flex items-center justify-between w-full mb-3">
                            <div class="h-8 w-8 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center text-sky-500">
                                <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                            </div>
                            <div class="h-4 w-4 rounded-full border flex items-center justify-center {storageProvider === 'cloudinary' ? 'border-[#FDA4AF] bg-[#FDA4AF]' : 'border-gray-300'}">
                                {#if storageProvider === 'cloudinary'}
                                    <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
                                {/if}
                            </div>
                        </div>
                        <div>
                            <p class="text-[13px] font-black {storageProvider === 'cloudinary' ? 'text-gray-900' : 'text-gray-600'}">Twoly Cloud</p>
                            <p class="text-[10.5px] text-gray-400 font-medium leading-tight mt-0.5">Optimized CDN storage</p>
                        </div>
                    </button>
                </div>

                <!-- Google Drive Specific Configuration -->
                {#if storageProvider === 'gdrive'}
                    <div class="rounded-2xl bg-gray-50/60 border border-gray-100 p-4.5 space-y-4">
                        <!-- Account Link Status Row -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-600">
                                    <svg class="h-4 w-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-gray-800">
                                        {isOAuthConnected ? 'Google Account Connected' : 'Google Account Required'}
                                    </p>
                                    <p class="text-[10.5px] text-gray-400 font-medium">
                                        {isOAuthConnected ? 'Uploads will sync directly to your Drive' : 'Link your account to enable direct Drive uploads'}
                                    </p>
                                </div>
                            </div>

                            {#if isOAuthConnected}
                                <button
                                    type="button"
                                    onclick={handleDisconnectGDrive}
                                    disabled={isDisconnectingDrive}
                                    class="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors px-2 py-1 disabled:opacity-50"
                                >
                                    {isDisconnectingDrive ? 'Disconnecting...' : 'Disconnect'}
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    onclick={handleConnectOAuth}
                                    disabled={isConnectingOAuth}
                                    class="px-3.5 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-xs disabled:opacity-60"
                                >
                                    {isConnectingOAuth ? 'Connecting...' : 'Connect'}
                                </button>
                            {/if}
                        </div>

                        <!-- Target Folder Input -->
                        <div class="pt-3 border-t border-gray-200/50 space-y-1.5">
                            <div class="flex items-center justify-between">
                                <label for="gdriveFolderUrl" class="text-[11px] font-bold text-gray-500 tracking-wide">Root Folder Link (Optional)</label>
                                {#if gdriveFolderUrl.trim()}
                                    <button 
                                        type="button" 
                                        onclick={handleVerifyGDrive} 
                                        disabled={isVerifyingDrive}
                                        class="text-[11px] font-bold text-[#FDA4AF] hover:text-[#FB7185] transition-colors disabled:opacity-50"
                                    >
                                        {isVerifyingDrive ? 'Checking...' : 'Verify'}
                                    </button>
                                {/if}
                            </div>
                            <Input 
                                id="gdriveFolderUrl"
                                type="url" 
                                placeholder="Auto-creates 'Twoly Couple Space' if empty" 
                                bind:value={gdriveFolderUrl} 
                            />
                            {#if verifiedFolderName}
                                <p class="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                                    <svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                    Folder linked: {verifiedFolderName}
                                </p>
                            {:else}
                                <p class="text-[10.5px] text-gray-400 font-medium">Subfolders will be generated automatically for each memory.</p>
                            {/if}
                        </div>
                    </div>
                {/if}

                <div class="pt-1">
                    <Button type="submit" variant="secondary" size="md" class="w-full shadow-xs hover:shadow-sm transition-all border-gray-100" isLoading={isSavingGDrive}>
                        Save Storage Settings
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
                confirmText="Log Out"
                onDelete={handleLogout}
            />
            <p class="text-center text-[11px] font-bold text-gray-400 mt-6 tracking-widest">
                TWOLY V1.0.0
            </p>
        </section>

    </main>
</MobileShell>

<AlertDialog 
    bind:isOpen={alertState.isOpen} 
    title={alertState.title} 
    message={alertState.message} 
/>