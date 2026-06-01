<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { browser } from '$app/environment';
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

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Mendefinisikan tipe data untuk response dari Google
    interface GoogleCredentialResponse {
        credential: string;
        clientId?: string;
        select_by?: string;
    }

    // Mendefinisikan struktur objek google yang ada di window
    interface WindowWithGoogle extends Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
                };
            };
        };
    }

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

    async function handleGoogleResponse(response: GoogleCredentialResponse) {
        isLoading = true;
        errorMessage = '';

        try {
            await authService.googleLogin(response.credential);
            await goto(resolve('/join-couple'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Google sign up failed. Please try again.';
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        if (!browser || !googleClientId) return;

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // Menghindari penggunaan 'any' dengan WindowWithGoogle
            const win = window as unknown as WindowWithGoogle;
            const google = win.google;
            
            if (google) {
                google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleResponse
                });
                
                const container = document.getElementById("google-button-container");
                if (container) {
                    google.accounts.id.renderButton(
                        container,
                        { theme: "outline", size: "large", width: "100%", shape: "pill", text: "continue_with" }
                    );
                }
            }
        };
        
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    });
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

            <div class="space-y-4">
                <!-- Google OAuth Button Container -->
                <div id="google-button-container" class="w-full flex justify-center min-h-[44px]"></div>

                <div class="relative flex items-center py-1">
                    <div class="flex-grow border-t border-gray-200"></div>
                    <span class="shrink-0 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Or create with email</span>
                    <div class="flex-grow border-t border-gray-200"></div>
                </div>

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
        </div>

        <div class="mt-8 text-center text-sm font-medium text-gray-500">
            Already have an account?
            <a href={resolve('/login')} class="font-extrabold text-[#FDA4AF] hover:text-[#F8B4C8] transition-colors">
                Log in here
            </a>
        </div>
    </div>
</div>