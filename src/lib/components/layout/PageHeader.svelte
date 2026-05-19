<script lang="ts">
    import { resolve } from '$app/paths';
    import type { Snippet } from 'svelte';

    type BackUrl = '/' | '/calendar' | '/dashboard' | '/date-plans' | '/date-plans/new' | '/gallery' | '/join-couple' | '/login' | '/love-notes' | '/love-notes/new' | '/memories' | '/memories/new';

    interface Props {
        title: string;
        subtitle?: string;
        backUrl?: BackUrl;
        leftContent?: Snippet;
        rightContent?: Snippet;
    }

    let { title, subtitle, backUrl, leftContent, rightContent }: Props = $props();
</script>

<header class="sticky top-0 z-40 flex items-start gap-4 border-b border-[#F8B4C8]/20 bg-[#FFF7ED]/90 px-6 pb-5 pt-[calc(env(safe-area-inset-top)+2.75rem)] backdrop-blur-2xl transition-all">
    {#if backUrl}
        <a aria-label="Go back" href={resolve(backUrl)} class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-900 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] transition-transform hover:bg-gray-50 active:scale-90">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
        </a>
    {/if}
    
    <div class="min-w-0 flex-1 overflow-hidden">
        {#if leftContent}
            <div class="mb-3">
                {@render leftContent()}
            </div>
        {/if}
        <h1 class="truncate text-2xl font-black tracking-tight text-gray-900 leading-tight">{title}</h1>
        {#if subtitle}
            <p class="mt-1 truncate text-[11px] font-bold uppercase tracking-widest text-gray-400">{subtitle}</p>
        {/if}
    </div>

    {#if rightContent}
        <div class="shrink-0">
            {@render rightContent()}
        </div>
    {/if}
</header>