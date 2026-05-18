<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import { browser } from '$app/environment';
    import { uiStore } from '$lib/stores/ui.store.svelte';

    const navItems = [
        { name: 'Home', path: '/dashboard', icon: 'home' },
        { name: 'Memories', path: '/memories', icon: 'polaroid' },
        { name: 'Touch', path: '/touch', icon: 'heart', isSpecial: true },
        { name: 'Plans', path: '/date-plans', icon: 'calendar' },
        { name: 'More', path: '/settings', icon: 'menu' }
    ] as const;

    let lastScrollY = $state(0);
    let isHiddenByScroll = $state(false);

    function handleScroll() {
        if (!browser) return;
        const currentScrollY = window.scrollY;

        if (currentScrollY < 60) {
            isHiddenByScroll = false;
            lastScrollY = currentScrollY;
            return;
        }

        if (currentScrollY > lastScrollY + 5) {
            isHiddenByScroll = true; 
        } else if (currentScrollY < lastScrollY - 5) {
            isHiddenByScroll = false; 
        }

        lastScrollY = currentScrollY;
    }

    let finalIsHidden = $derived(uiStore.isNavHidden || isHiddenByScroll);
</script>

<svelte:window onscroll={handleScroll} />

<nav class="fixed bottom-8 left-0 right-0 z-50 mx-auto w-[92%] max-w-[380px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] {finalIsHidden ? 'translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}">
    
    <div class="relative flex h-[72px] w-full items-center justify-between rounded-[36px] border border-white/80 bg-white/85 shadow-[0_16px_40px_-10px_rgba(253,164,175,0.2)] backdrop-blur-2xl">
        
        <div class="grid h-full w-full grid-cols-5 items-center justify-items-center">
            
            {#each navItems as item (item.path)}
                {#if 'isSpecial' in item && item.isSpecial}
                    <div class="col-span-1 h-full w-full"></div>
                {:else}
                    {@const isActive = page.url.pathname.startsWith(item.path)}
                    
                    <a 
                        href={resolve(item.path)} 
                        aria-label={item.name}
                        class="group relative flex h-full w-full flex-col items-center justify-center outline-none"
                    >
                        <div class="flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 {isActive ? 'bg-[#FDA4AF]/20 text-[#FDA4AF]' : 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600'}">
                            
                            {#if item.icon === 'home'}
                                <svg class="h-6 w-6 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    {#if isActive}
                                        <path d="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V10z"/>
                                    {:else}
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    {/if}
                                </svg>
                            {:else if item.icon === 'polaroid'}
                                <svg class="h-[22px] w-[22px] transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    {#if isActive}
                                        <path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h16v10H4V7zm3 2a2 2 0 100 4 2 2 0 000-4zm-3 7l4-4 4 4v1H4v-1zm9-3l3-3 4 4v2h-7v-3z" clip-rule="evenodd" fill-rule="evenodd"/>
                                    {:else}
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    {/if}
                                </svg>
                            {:else if item.icon === 'calendar'}
                                <svg class="h-[22px] w-[22px] transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill={isActive ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    {#if isActive}
                                        <path d="M19 4h-2V3a1 1 0 10-2 0v1H9V3a1 1 0 00-2 0v1H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z"/>
                                    {:else}
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    {/if}
                                </svg>
                            {:else if item.icon === 'menu'}
                                <svg class="h-6 w-6 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={isActive ? "3" : "2.2"} d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            {/if}
                        </div>
                        
                        <div class="absolute bottom-[6px] h-[5px] w-[5px] rounded-full bg-[#FDA4AF] transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] {isActive ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-2'}"></div>
                    </a>
                {/if}
            {/each}
            
        </div>
        <a 
            href={resolve('/touch')} 
            aria-label="Realtime Touch"
            class="absolute left-1/2 -top-[24px] flex h-[78px] w-[78px] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[#FFF7ED] bg-gradient-to-tr from-[#FDA4AF] to-[#F8B4C8] text-white shadow-[0_12px_24px_-6px_rgba(253,164,175,0.6)] outline-none transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:shadow-[0_16px_32px_-6px_rgba(253,164,175,0.7)] active:scale-95"
        >
            <svg class="h-8 w-8 mt-[2px]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
            </svg>
        </a>

    </div>
</nav>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
</style>