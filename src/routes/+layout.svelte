<script lang="ts">
    import '../app.css';
    import { browser } from '$app/environment';
    import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
    import type { Snippet } from 'svelte';

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
</script>

<svelte:head>
</svelte:head>

<div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" class="text-gray-900 bg-[#FFF7ED] min-h-screen selection:bg-[#F8B4C8] selection:text-white antialiased">
    <QueryClientProvider client={queryClient}>
        {@render children()}
    </QueryClientProvider>
</div>