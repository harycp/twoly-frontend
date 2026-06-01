<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { browser } from '$app/environment';
    import { authService } from '$lib/services/auth.service';
    import Button from '$lib/components/common/Button.svelte';
    import Input from '$lib/components/common/Input.svelte';
    
    import logo from '$lib/assets/logos/twoly.webp';

    let emailOrUsername = $state('');
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

    async function handleGoogleResponse(response: GoogleCredentialResponse) {
        isLoading = true;
        errorMessage = '';

        try {
            // Mengirim JWT id_token dari Google ke Backend Go
            await authService.googleLogin(response.credential);
            await goto(resolve('/dashboard'));
        } catch (error: unknown) {
            errorMessage = error instanceof Error ? error.message : 'Google login failed. Please try again.';
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

            <div class="space-y-5">
                <!-- Google OAuth Button Container -->
                <div id="google-button-container" class="w-full flex justify-center min-h-[44px]"></div>

                <div class="relative flex items-center py-1">
                    <div class="flex-grow border-t border-gray-200"></div>
                    <span class="shrink-0 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Or continue with email</span>
                    <div class="flex-grow border-t border-gray-200"></div>
                </div>

                <form onsubmit={handleLogin} class="space-y-5">
                    <Input
                        label="Email or Username"
                        type="text"
                        placeholder="Enter your email or username"
                        bind:value={emailOrUsername}
                        required
                    />
                    <div>
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            bind:value={password}
                            required
                        />
                        <div class="flex justify-end mt-2">
                            <a href={resolve('/forgot-password')} class="text-[11px] font-bold text-gray-400 hover:text-[#FDA4AF] transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>
                    <div class="pt-2">
                        <Button type="submit" class="w-full" {isLoading}>Log In</Button>
                    </div>
                </form>
            </div>
        </div>

        <div class="mt-8 text-center text-sm font-medium text-gray-500">
            Don't have an account?
            <a href={resolve('/register')} class="font-extrabold text-[#FDA4AF] hover:text-[#F8B4C8] transition-colors">
                Create space
            </a>
        </div>
    </div>
</div>