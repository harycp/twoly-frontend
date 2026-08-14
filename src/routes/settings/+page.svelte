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

    // State Global & Alert
    let alertState = $state({ isOpen: false, title: '', message: '' });
    
    let partnerName = $derived(coupleStore.partner?.name || 'Waiting for partner...');
    let myInitials = $derived(authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : '?');
    let isDriveConnected = $derived(Boolean(coupleStore.data?.gdrive_folder_id || (gdriveFolderUrl.trim() && verifiedFolderName)));

    onMount(async () => {
        if (!authStore.isAuthenticated) {
            void goto(resolve('/login'));
            return;
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
            alertState = { isOpen: true, title: 'Settings Saved! 🚀', message: 'Google Drive storage configuration has been saved successfully!' };
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

        <!-- FORM 3: GOOGLE DRIVE CLOUD STORAGE (10TB) -->
        <section class="rounded-[36px] bg-white/70 backdrop-blur-2xl p-7 shadow-[0_12px_40px_-16px_rgba(59,130,246,0.15)] border border-white/80 relative overflow-hidden">
            <div class="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-[#93C5FD] opacity-15 blur-3xl pointer-events-none"></div>

            <div class="mb-6 flex items-center justify-between border-b border-blue-100/50 pb-4 relative z-10">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-blue-50 text-blue-500 shadow-sm border border-blue-100/60">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-[14px] font-black uppercase tracking-widest text-gray-800">Google Drive</h3>
                        <p class="text-[11px] font-bold text-blue-500">10 TB Cloud Storage</p>
                    </div>
                </div>

                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider {isDriveConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-500'}">
                    <span class="h-1.5 w-1.5 rounded-full {isDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}"></span>
                    {isDriveConnected ? 'Connected' : 'Not Connected'}
                </span>
            </div>

            <form onsubmit={handleSaveGDrive} class="space-y-5 relative z-10">
                <div>
                    <Input 
                        label="Google Drive Folder Link" 
                        type="url" 
                        placeholder="https://drive.google.com/drive/folders/..." 
                        bind:value={gdriveFolderUrl} 
                    />
                    <p class="text-[11px] font-medium text-gray-400 mt-2 px-1">
                        Paste link folder Google Drive 10TB Anda. Pastikan akses di-setting <strong>"Anyone with the link can edit"</strong>.
                    </p>
                </div>

                {#if verifiedFolderName}
                    <div class="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3.5 flex items-center gap-3">
                        <div class="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Folder Verified</p>
                            <p class="text-xs font-black text-emerald-900 truncate">{verifiedFolderName}</p>
                        </div>
                    </div>
                {/if}

                <!-- Storage Provider Preference -->
                <div class="flex flex-col gap-2">
                    <label for="storageProviderSelect" class="text-[12px] font-black text-gray-500 uppercase tracking-widest ml-1">Default Storage Provider</label>
                    <div id="storageProviderSelect" class="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onclick={() => storageProvider = 'gdrive'}
                            class="p-3 rounded-2xl border text-left transition-all duration-300 {storageProvider === 'gdrive' ? 'bg-blue-500 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-white/50 border-white text-gray-700 hover:bg-white/80'}"
                        >
                            <p class="text-xs font-black">Google Drive 10TB</p>
                            <p class="text-[10px] opacity-80 mt-0.5">High Capacity</p>
                        </button>

                        <button
                            type="button"
                            onclick={() => storageProvider = 'cloudinary'}
                            class="p-3 rounded-2xl border text-left transition-all duration-300 {storageProvider === 'cloudinary' ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-[1.02]' : 'bg-white/50 border-white text-gray-700 hover:bg-white/80'}"
                        >
                            <p class="text-xs font-black">Cloudinary</p>
                            <p class="text-[10px] opacity-80 mt-0.5">Fast CDN</p>
                        </button>
                    </div>
                </div>

                <!-- Service Account Helper -->
                {#if serviceAccountEmail}
                    <div class="rounded-2xl bg-white/40 border border-white/60 p-4 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-black uppercase tracking-wider text-gray-500">Service Account Email</span>
                            <button 
                                type="button" 
                                onclick={copyServiceAccountEmail} 
                                class="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                                Copy Email
                            </button>
                        </div>
                        <p class="text-xs font-mono text-gray-700 break-all bg-white/60 p-2 rounded-xl border border-gray-100 select-all">
                            {serviceAccountEmail}
                        </p>
                        <p class="text-[10px] font-medium text-gray-400">
                            Tips: Anda juga bisa membagikan (Share/Invite) folder Google Drive langsung ke email di atas sebagai Editor.
                        </p>
                    </div>
                {/if}

                <div class="flex gap-2 pt-2">
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="md" 
                        class="flex-1 bg-white border-white shadow-sm" 
                        isLoading={isVerifyingDrive} 
                        onclick={handleVerifyGDrive}
                    >
                        Test Folder Link
                    </Button>

                    <Button 
                        type="submit" 
                        size="md" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                        isLoading={isSavingGDrive}
                    >
                        Save Drive Settings
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