<script lang="ts">
    import MobileShell from '$lib/components/layout/MobileShell.svelte';
    import Button from '$lib/components/common/Button.svelte';
    import { page } from '$app/stores';
    import { resolve } from '$app/paths';
    import logo from '$lib/assets/logos/twoly.webp';

    let status = $derived($page.status ?? 500);
    let message = $derived($page.error?.message ?? 'Page not found');
</script>

<MobileShell>
    <main class="px-6 pb-32">
        <div class="mx-auto max-w-md pt-12">
            <div class="relative mb-8">
                <div class="absolute inset-0 rounded-full bg-[#FDA4AF]/20 blur-3xl -z-10"></div>
                <div class="relative flex h-32 w-32 items-center justify-center rounded-4xl bg-white/60 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(253,164,175,0.35)] border border-white -rotate-3 transition-transform duration-500 hover:rotate-0 mx-auto">
                    <img src={logo} alt="Twoly" class="h-16 w-16 object-contain opacity-80" />
                    <div class="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-900 text-white shadow-lg border-4 border-[#FFF7ED] rotate-12">
                        <span class="text-lg font-black">{status}</span>
                    </div>
                </div>
            </div>

            <h1 class="text-3xl font-black text-gray-900 text-center mb-2">{status === 404 ? 'Lost your way?' : 'Something went wrong'}</h1>
            <p class="text-sm font-medium text-gray-500 text-center max-w-70 mx-auto mb-6">{status === 404 ? 'This path does not exist. Let me guide you back to your shared space.' : message}</p>

            <div class="w-full rounded-4xl bg-white/80 backdrop-blur-2xl p-6 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.05)] border border-white">
                <a href={resolve('/dashboard')} class="block mb-3">
                    <Button class="w-full" variant="primary" size="lg">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Take me home
                    </Button>
                </a>

                <a href={resolve('/')} class="block text-center text-sm font-extrabold text-gray-500 uppercase tracking-widest hover:text-[#FDA4AF]">
                    Back to Welcome Page
                </a>
            </div>
        </div>
    </main>
</MobileShell>
