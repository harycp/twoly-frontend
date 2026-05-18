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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
</svelte:head>

<div style="font-family: 'Plus Jakarta Sans', sans-serif;" class="text-gray-900 bg-[#FFF7ED] min-h-screen selection:bg-[#F8B4C8] selection:text-white antialiased">
    <QueryClientProvider client={queryClient}>
        {@render children()}
    </QueryClientProvider>
</div>