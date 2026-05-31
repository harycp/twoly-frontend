<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    interface Heart {
        id: number;
        x: number;
        size: number;
        isFromPartner: boolean;
        combo: number;
    }

    interface Props {
        hearts: Heart[];
    }

    let { hearts }: Props = $props();
</script>

<!-- PERBAIKAN: 
     1. Menghapus 'overflow-hidden' agar hati tidak terpotong garis lurus.
     2. Mengubah 'absolute' menjadi 'fixed' dan 'z-[100]' agar hati benar-benar melayang menutupi seluruh layar (termasuk melewati header di atas). 
-->
<div class="fixed inset-0 pointer-events-none z-100">
    {#each hearts as heart (heart.id)}
        <div 
            class="absolute bottom-[35%] origin-bottom"
            style="left: {heart.x}%;"
            in:scale={{ duration: 300, start: 0.2, easing: quintOut }}
            out:fade={{ duration: 1000 }}
        >
            <div class="animate-float-up opacity-0" style="animation-duration: {1.5 + Math.random()}s; --rot-end: {heart.id % 2 === 0 ? '25deg' : '-25deg'};">
                <svg 
                    class="{heart.isFromPartner ? 'text-rose-400 drop-shadow-[0_0_25px_rgba(2fb,113,133,0.8)]' : 'text-white/20 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]'} fill-current" 
                    style="width: {heart.size}px; height: {heart.size}px;"
                    viewBox="0 0 24 24"
                >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            </div>
        </div>
    {/each}
</div>

<style>
    @keyframes floatUp {
        0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; filter: blur(2px); }
        15% { opacity: 1; filter: blur(0px); }
        70% { opacity: 0.9; }
        100% { transform: translateY(-450px) scale(1.8) rotate(var(--rot-end)); opacity: 0; filter: blur(4px); }
    }
    .animate-float-up {
        animation-name: floatUp;
        animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
        animation-fill-mode: forwards;
    }
</style>