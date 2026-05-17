<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import { uiStore } from '$lib/stores/ui.store.svelte';

    const navItems = [
        { name: 'Home', path: '/dashboard', icon: 'home' },
        { name: 'Memories', path: '/memories', icon: 'polaroid' },
        { name: 'Touch', path: '/touch', icon: 'heart', isSpecial: true },
        { name: 'Plans', path: '/date-plans', icon: 'calendar' },
        { name: 'More', path: '/settings', icon: 'menu' }
    ];
</script>

<nav class="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-[calc(28rem-2rem)] rounded-[2rem] border border-white/60 bg-white/70 px-2 py-2 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(253,164,175,0.4)] transition-all duration-500 ease-in-out {uiStore.isNavHidden ? 'translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}">
    <div class="flex items-center justify-between px-1">
        {#each navItems as item (item.path)}
            <a 
                href={resolve(item.path as any)} 
                class="relative flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out active:scale-90 {item.isSpecial ? '-mt-10' : 'hover:-translate-y-1'}"
            >
                {#if item.isSpecial}
                    <div class="group flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-[0_10px_25px_-5px_rgba(248,180,200,0.8)] ring-[6px] ring-[#FFF7ED] transition-transform hover:scale-105">
                        <svg class="h-8 w-8 transition-transform group-active:scale-75" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                {:else}
                    {@const isActive = page.url.pathname.startsWith(item.path)}
                    
                    <div class="flex h-10 w-10 items-center justify-center rounded-[1rem] transition-colors duration-300 {isActive ? 'bg-[#F8B4C8]/20 text-[#FDA4AF]' : 'text-gray-400 hover:bg-gray-100'}">
                        {#if item.icon === 'home'}
                            <svg class="h-6 w-6" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={isActive ? "0" : "2.5"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        {:else if item.icon === 'polaroid'}
                            <svg class="h-6 w-6" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={isActive ? "0" : "2.5"} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {:else if item.icon === 'calendar'}
                            <svg class="h-6 w-6" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={isActive ? "0" : "2.5"} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {:else if item.icon === 'menu'}
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={isActive ? "3" : "2.5"} d="M4 6h16M4 12h16M4 18h16"/></svg>
                        {/if}
                    </div>
                    {#if isActive}
                        <div class="absolute -bottom-1 h-1 w-1 rounded-full bg-[#FDA4AF]"></div>
                    {/if}
                {/if}
            </a>
        {/each}
    </div>
</nav>

<style>
    :global(.font-handwritten) { font-family: 'Caveat', cursive; }
</style>