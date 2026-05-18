<script lang="ts">
    import { resolve } from '$app/paths';
    import type { Snippet } from 'svelte';

    type BackUrl = '/' | '/calendar' | '/dashboard' | '/date-plans' | '/date-plans/new' | '/gallery' | '/join-couple' | '/login' | '/love-notes' | '/love-notes/new' | '/memories' | '/memories/new';

    interface Props {
        title: string;
        subtitle?: string;
        backUrl?: BackUrl;
        rightContent?: Snippet;
    }

    let { title, subtitle, backUrl, rightContent }: Props = $props();
</script>

<header class="sticky top-0 z-40 px-6 pt-12 pb-4 bg-[#FFF7ED]/90 backdrop-blur-2xl border-b border-[#F8B4C8]/20 flex items-center gap-4 transition-all">
    {#if backUrl}
        <a aria-label="Go back" href={resolve(backUrl)} class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] border border-gray-100 text-gray-900 transition-transform active:scale-90 hover:bg-gray-50">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
        </a>
    {/if}
    
    <div class="flex-1 overflow-hidden">
        <h1 class="truncate text-2xl font-black text-gray-900 tracking-tight leading-none">{title}</h1>
        {#if subtitle}
            <p class="truncate text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">{subtitle}</p>
        {/if}
    </div>

    {#if rightContent}
        <div class="shrink-0">
            {@render rightContent()}
        </div>
    {/if}
</header>