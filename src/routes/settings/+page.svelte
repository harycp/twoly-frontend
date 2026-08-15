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

        <!-- FORM 3: MEDIA STORAGE (GOOGLE DRIVE & CLOUDINARY) -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.08)] border border-white/80 space-y-6">
            <div class="flex items-center justify-between border-b border-gray-100/50 pb-4">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gray-100/80 text-gray-600">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Media Storage</h3>
                        <p class="text-[11px] font-medium text-gray-400">Choose where couple memories are stored</p>
                    </div>
                </div>

                {#if storageProvider === 'gdrive' && isOAuthConnected}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Drive Active
                    </span>
                {:else if storageProvider === 'gdrive'}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Link Required
                    </span>
                {/if}
            </div>

            <!-- GOOGLE ACCOUNT CONNECTION CARD -->
            <div class="rounded-2xl border border-white/80 bg-white/50 p-4 shadow-sm backdrop-blur-md">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
                            <svg class="h-6 w-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-xs font-black uppercase tracking-wider text-gray-900">
                                {isOAuthConnected ? 'Google Drive Linked' : 'Link Google Drive'}
                            </h4>
                            <p class="text-[11px] text-gray-500 font-medium leading-relaxed">
                                {isOAuthConnected 
                                    ? 'Connected with your Google storage for uploads.' 
                                    : 'Authorize Twoly to upload directly to your personal Google Drive.'}
                            </p>
                        </div>
                    </div>

                    {#if isOAuthConnected}
                        <button
                            type="button"
                            onclick={handleDisconnectGDrive}
                            disabled={isDisconnectingDrive}
                            class="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors disabled:opacity-50"
                        >
                            {isDisconnectingDrive ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    {/if}
                </div>

                {#if !isOAuthConnected}
                    <div class="mt-3.5 pt-3 border-t border-gray-100/60">
                        <button
                            type="button"
                            onclick={handleConnectOAuth}
                            disabled={isConnectingOAuth}
                            class="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-wider hover:bg-gray-800 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60"
                        >
                            {#if isConnectingOAuth}
                                <span class="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                                <span>Redirecting to Google...</span>
                            {:else}
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                                </svg>
                                <span>Connect Google Drive</span>
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>

            <form onsubmit={handleSaveGDrive} class="space-y-5">
                <!-- FOLDER URL INPUT -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between ml-1">
                        <label for="gdriveFolderUrl" class="text-[12px] font-black text-gray-500 uppercase tracking-widest">Google Drive Folder Link</label>
                        {#if gdriveFolderUrl.trim()}
                            <button 
                                type="button" 
                                onclick={handleVerifyGDrive} 
                                disabled={isVerifyingDrive}
                                class="text-[11px] font-bold text-[#FDA4AF] hover:text-[#FB7185] transition-colors disabled:opacity-50"
                            >
                                {isVerifyingDrive ? 'Verifying...' : 'Verify Folder'}
                            </button>
                        {/if}
                    </div>
                    <Input 
                        id="gdriveFolderUrl"
                        type="url" 
                        placeholder="https://drive.google.com/drive/folders/..." 
                        bind:value={gdriveFolderUrl} 
                    />
                    {#if verifiedFolderName}
                        <p class="text-[11px] font-bold text-emerald-600 ml-1 flex items-center gap-1">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            {verifiedFolderName}
                        </p>
                    {/if}
                </div>

                <!-- Storage Provider Preference -->
                <div class="flex flex-col gap-2 w-full">
                    <span class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Default Storage Provider</span>
                    <div class="flex p-1.5 bg-white/40 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.02)]">
                        <button
                            type="button"
                            onclick={() => storageProvider = 'gdrive'}
                            class="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-[14px] transition-all duration-300 {storageProvider === 'gdrive' ? 'bg-white text-gray-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)] border border-gray-50' : 'text-gray-400 hover:text-gray-600'}"
                        >
                            Google Drive
                        </button>
                        <button
                            type="button"
                            onclick={() => storageProvider = 'cloudinary'}
                            class="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-[14px] transition-all duration-300 {storageProvider === 'cloudinary' ? 'bg-white text-gray-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)] border border-gray-50' : 'text-gray-400 hover:text-gray-600'}"
                        >
                            Cloudinary
                        </button>
                    </div>
                </div>

                <!-- Service Account / Folder Sharing Guide -->
                {#if serviceAccountEmail}
                    <div class="pt-1">
                        <button
                            type="button"
                            onclick={() => showPermissionsHelp = !showPermissionsHelp}
                            class="text-[11px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors ml-1"
                        >
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>{showPermissionsHelp ? 'Hide sharing guide' : 'Need sync permissions? View guide'}</span>
                        </button>

                        {#if showPermissionsHelp}
                            <div class="mt-3 p-4 rounded-2xl bg-white/50 border border-white/80 space-y-2.5 text-[12px] text-gray-600">
                                <p class="font-medium leading-relaxed">
                                    To allow auto-syncing files placed directly in Drive, set folder access to <strong>"Anyone with the link can edit"</strong>, or invite this helper bot as Editor:
                                </p>
                                <div class="flex items-center gap-2">
                                    <span class="flex-1 bg-white px-3 py-2 rounded-xl text-[11px] text-gray-800 truncate border border-gray-100 font-mono">
                                        {serviceAccountEmail}
                                    </span>
                                    <button
                                        type="button"
                                        onclick={copyServiceAccountEmail}
                                        class="px-3 py-2 rounded-xl bg-gray-900 text-white text-[11px] font-bold shrink-0 active:scale-95 transition-transform"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <div class="pt-3">
                    <Button type="submit" variant="secondary" size="md" class="w-full shadow-sm hover:shadow-md transition-all border-gray-100" isLoading={isSavingGDrive}>
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