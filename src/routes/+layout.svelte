<script lang="ts">
    import '../app.css';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
    import type { Snippet } from 'svelte';
    import { authStore } from '$lib/stores/auth.store.svelte';
    import { authService } from '$lib/services/auth.service';

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
                staleTime: 1000 * 60 * 5,
                refetchOnWindowFocus: false
            },
        },
    });

    let { children }: { children: Snippet } = $props();

    onMount(async () => {
        if (!browser || !authStore.isAuthenticated) return;

        try {
            await authService.getMe();
        } catch {
            authService.logout();
        }
    });
</script>

<svelte:head>
    <link rel="icon" href="/favicon.ico" />
</svelte:head>

<div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" class="text-gray-900 bg-[#FFF7ED] min-h-screen selection:bg-[#F8B4C8] selection:text-white antialiased">
    <QueryClientProvider client={queryClient}>
        {@render children()}
    </QueryClientProvider>
</div>