<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { authService } from '$lib/services/auth.service';
    import Button from '$lib/components/common/Button.svelte';
    import Input from '$lib/components/common/Input.svelte';
    
    import logo from '$lib/assets/logos/twoly.webp';

    let emailOrUsername = $state('');
    let password = $state('');
    let isLoading = $state(false);
    let errorMessage = $state('');

    async function handleLogin(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        try {
            await authService.login({ email_or_username: emailOrUsername, password });
            await goto(resolve('/dashboard'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Failed to log in. Please check your credentials.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-[#FFF7ED] p-6 relative overflow-hidden">
    <div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#F8B4C8] opacity-20 blur-3xl"></div>
    <div class="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-[#FED7AA] opacity-20 blur-3xl"></div>

    <div class="w-full max-w-md relative z-10">
        <div class="mb-10 text-center space-y-2">
            <div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-white shadow-[0_8px_30px_-10px_rgba(248,180,200,0.5)] border border-gray-50 rotate-3 transition-transform duration-500 hover:rotate-0">
                <img src={logo} alt="Twoly Logo" class="h-16 w-16 object-contain drop-shadow-sm" />
            </div>
            <h1 class="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
            <p class="text-base font-medium text-gray-500">Log in to your shared emotional space</p>
        </div>

        <div class="rounded-4xl bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] border border-white">
            {#if errorMessage}
                <div class="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                    {errorMessage}
                </div>
            {/if}

            <form onsubmit={handleLogin} class="space-y-5">
                <Input
                    label="Email or Username"
                    type="text"
                    placeholder="Enter your email or username"
                    bind:value={emailOrUsername}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    bind:value={password}
                    required
                />
                <div class="pt-4">
                    <Button type="submit" class="w-full" {isLoading}>Log In</Button>
                </div>
            </form>
        </div>

        <div class="mt-8 text-center text-sm font-medium text-gray-500">
            Don't have an account?
            <a href={resolve('/register')} class="font-extrabold text-[#FDA4AF] hover:text-[#F8B4C8] transition-colors">
                Create space
            </a>
        </div>
    </div>
</div>