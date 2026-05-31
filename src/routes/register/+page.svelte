<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { authService } from '$lib/services/auth.service';
    import Button from '$lib/components/common/Button.svelte';
    import Input from '$lib/components/common/Input.svelte';
    
    import logo from '$lib/assets/logos/twoly.webp';

    let name = $state('');
    let username = $state('');
    let email = $state('');
    let password = $state('');
    let isLoading = $state(false);
    let errorMessage = $state('');

    async function handleRegister(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            await authService.register({ name, username, email, password });
            await authService.login({ email_or_username: email, password });
            await goto(resolve('/join-couple'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to register. Please try again.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-[#FFF7ED] p-6 relative overflow-hidden">
    <div class="absolute top-0 -right-20 h-72 w-72 rounded-full bg-[#DDD6FE] opacity-30 blur-3xl"></div>
    <div class="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-[#F8B4C8] opacity-20 blur-3xl"></div>

    <div class="w-full max-w-md relative z-10 py-10">
        <div class="mb-10 text-center space-y-2">
            <img src={logo} alt="Twoly Logo" class="h-14 w-14 object-contain mx-auto mb-4 drop-shadow-md" />
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Create your space</h1>
            <p class="text-base font-medium text-gray-500">Start documenting your journey together</p>
        </div>

        <div class="rounded-4xl bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] border border-white">
            {#if errorMessage}
                <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                    {errorMessage}
                </div>
            {/if}

            <form onsubmit={handleRegister} class="space-y-4">
                <Input label="Full Name" type="text" placeholder="e.g. John Doe" bind:value={name} required />
                <Input label="Username" type="text" placeholder="Unique username" bind:value={username} required />
                <Input label="Email" type="email" placeholder="name@example.com" bind:value={email} required />
                <Input label="Password" type="password" placeholder="Minimum 6 characters" bind:value={password} minlength={6} required />

                <div class="pt-6">
                    <Button type="submit" class="w-full" {isLoading}>Start Journey</Button>
                </div>
            </form>
        </div>

        <div class="mt-8 text-center text-sm font-medium text-gray-500">
            Already have an account?
            <a href={resolve('/login')} class="font-extrabold text-[#FDA4AF] hover:text-[#F8B4C8] transition-colors">
                Log in here
            </a>
        </div>
    </div>
</div>