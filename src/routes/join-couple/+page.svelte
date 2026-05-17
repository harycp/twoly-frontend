<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { coupleService } from '$lib/services/couple.service';
    import { coupleStore } from '$lib/stores/couple.store.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import Input from '$lib/components/common/Input.svelte';
    
    import logo from '$lib/assets/logos/twoly.webp';

    let inviteCodeInput = $state('');
    let isJoining = $state(false);
    let isCreating = $state(false);
    let errorMessage = $state('');

    onMount(async () => {
        try {
            await coupleService.getMyCouple();
            if (coupleStore.isActive) await goto(resolve('/dashboard' as any));
        } catch (error) { /* Abaikan */ }
    });

    async function handleJoin(event: SubmitEvent) {
        event.preventDefault();
        if (!inviteCodeInput) {
            errorMessage = 'Please enter an invite code.';
            return;
        }
        isJoining = true;
        errorMessage = '';
        try {
            await coupleService.joinCouple({ invite_code: inviteCodeInput });
            await goto(resolve('/dashboard' as any));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to join couple. Check your code.';
        } finally {
            isJoining = false;
        }
    }

    async function handleCreateInvite() {
        isCreating = true;
        errorMessage = '';
        try {
            await coupleService.createInvite();
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to generate invite code.';
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-[#FFF7ED] p-6 relative overflow-hidden">
    <div class="w-full max-w-md relative z-10">
        <div class="mb-10 text-center space-y-2">
            <img src={logo} alt="Twoly Logo" class="h-14 w-14 object-contain mx-auto mb-4 drop-shadow-md" />
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Connect</h1>
            <p class="text-base font-medium text-gray-500">Link your account with your partner</p>
        </div>

        {#if errorMessage}
            <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                {errorMessage}
            </div>
        {/if}

        {#if coupleStore.isPending && coupleStore.data}
            <div class="rounded-[32px] bg-white p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] text-center border border-gray-50">
                <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8B4C8]/20 text-3xl">
                    💌
                </div>
                <p class="mb-2 text-sm font-bold text-gray-400 uppercase tracking-widest">Your Invite Code</p>
                <div class="mb-6 inline-block rounded-2xl bg-gray-50 px-8 py-4">
                    <span class="text-4xl font-black tracking-[0.2em] text-gray-900">{coupleStore.data.invite_code}</span>
                </div>
                <p class="text-sm font-medium text-gray-500 mb-8">
                    Share this code. The dashboard will unlock automatically once they join.
                </p>
                <Button variant="secondary" class="w-full" onclick={() => {
                    coupleService.getMyCouple().then(() => { if (coupleStore.isActive) goto(resolve('/dashboard' as any)); });
                }}>
                    Refresh Status
                </Button>
            </div>
        {:else}
            <div class="space-y-6">
                <div class="rounded-[32px] bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-white">
                    <h2 class="mb-6 text-sm font-extrabold text-gray-800 tracking-tight">Option 1: I have a code</h2>
                    <form onsubmit={handleJoin} class="space-y-4">
                        <Input type="text" placeholder="Enter partner's code" bind:value={inviteCodeInput} class="uppercase" required />
                        <Button type="submit" class="w-full" isLoading={isJoining}>Connect</Button>
                    </form>
                </div>

                <div class="flex items-center gap-4 px-4 opacity-50">
                    <div class="flex-1 border-t border-gray-300"></div>
                    <span class="text-xs font-bold uppercase tracking-widest text-gray-500">OR</span>
                    <div class="flex-1 border-t border-gray-300"></div>
                </div>

                <div class="rounded-[32px] bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] border border-white">
                    <h2 class="mb-2 text-sm font-extrabold text-gray-800 tracking-tight">Option 2: Create new code</h2>
                    <p class="mb-6 text-sm font-medium text-gray-500">Generate a unique code to share with your partner.</p>
                    <Button type="button" variant="secondary" class="w-full" onclick={handleCreateInvite} isLoading={isCreating}>
                        Generate Code
                    </Button>
                </div>
            </div>
        {/if}
    </div>
</div>